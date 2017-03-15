/*
 * A smart pull-down-refresh and pull-up-loadmore react-native listview
 * https://github.com/react-native-component/react-native-smart-pull-to-refresh-listview/
 * Released under the MIT license
 * Copyright (c) 2016 react-native-component <moonsunfall@aliyun.com>
 */

import React, {
    PropTypes,
    Component,
} from 'react'
import {
    View,
    ScrollView,
    ListView,
    StyleSheet,
    Text,
    Platform,
} from 'react-native'

//import TimerEnhance from '../react-native-smart-timer-enhance'
import TimerEnhance from 'react-native-smart-timer-enhance'
import { withinErrorMargin, } from './utils'
import constants, {
    viewType,
    viewState,
    refreshViewType,
    refreshAnimationDuration,
    scrollBounceAnimationDuration,
} from './constants'
import { easeOutCirc, } from './easing'
import RefreshView from './RefreshView'
import ListItem from './ListItem'

const styles = StyleSheet.create({
    header: {
        justifyContent: 'flex-end',
    },
    footer: {
        justifyContent: 'flex-start',
    },
    shrink: {
        height: 0,
    },
    marginVertical: {
        marginTop: 0,
        marginBottom: 0,
        marginVertical: 0,
    },
    paddingVertical: {
        paddingTop: 0,
        paddingBottom: 0,
        paddingVertical: 0,
    }
})

class PullToRefreshListView extends Component {

    static constants = constants

    static defaultProps = {
        viewType: viewType.scrollView,
        pullUpDistance: 50,
        pullUpStayDistance: 35,
        pullDownDistance: 50,
        pullDownStayDistance: 35,
        enabledPullUp: true,
        enabledPullDown: true,
        autoLoadMore: false,
        scrollEventThrottle: 16,
        dataSource: new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2,
        }),
        renderRow: () => null,
        renderScrollComponent: props => <ScrollView {...props}/>,
        onEndReachedThreshold: StyleSheet.hairlineWidth,    //0,
        initialListSize: 10,
        stickyHeaderIndices: [],
        pageSize: 1,
        scrollRenderAheadDistance: 1000,
    }

    static propTypes = {
        ...ListView.propTypes,
        listItemProps: PropTypes.shape(View.propTypes),
        viewType: PropTypes.oneOf([
            viewType.scrollView,
            viewType.listView,
        ]),
        pullUpDistance: PropTypes.number,
        pullUpStayDistance: PropTypes.number,
        pullDownDistance: PropTypes.number,
        pullDownStayDistance: PropTypes.number,
        enabledPullUp: PropTypes.bool,
        enabledPullDown: PropTypes.bool,
        autoLoadMore: PropTypes.bool,
        onRefresh: PropTypes.func,
        onLoadMore: PropTypes.func,
    }

    constructor (props) {
        super(props)
        this.state = {}
        let {refresh_none, load_more_none} = viewState

        if (props.autoLoadMore && props.viewType == viewType.listView) {
            this._onEndReached = () => {
                let { refreshing, load_more_none, loading_more,} = viewState
                //if (this._refreshState != refreshing && this._loadMoreState == load_more_none) {
                if (this._canLoadMore && this._refreshState != refreshing && this._loadMoreState == load_more_none) {
                    this._loadMoreState = loading_more
                    this._footer.setState({
                        pullState: this._loadMoreState,
                    })

                    props.onLoadMore && props.onLoadMore()
                }
            }
        }

        /**
         * (occurs on react-native 0.32, and maybe also occurs on other versions)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
         * ScrollView does not exist this strange bug
         */
        this._fixedBoundary = !props.autoLoadMore && props.viewType == viewType.scrollView ? 0 : StyleSheet.hairlineWidth

        this._refreshState = refresh_none
        this._loadMoreState = load_more_none
        this._refreshBackAnimating = false
        this._loadMoreBackAnimating = false
        this._afterRefreshBacked = false
        this._afterLoadMoreBacked = false
        this._beginTimeStamp = null
        this._beginResetScrollTopTimeStamp = null
        this._refreshBackAnimationFrame = null
        this._touching = false
        this._scrollY = 0
        this._lastScrollY = 0
        this._fixedScrollY = 0
        this._refreshFixScrollY = 0
        this._paddingBlankDistance = 0

        this._listItemRefs = {}

        this._headerHeight = 0
        this._canLoadMore = false
        this._autoLoadFooterHeight = 0
        this._onRefreshed = false
    }

    render () {
        return (
            this.props.viewType == viewType.scrollView ?
                <ScrollView
                    ref={ component => this._scrollView = component }
                    {...this.props}
                    style={[this.props.style, styles.paddingVertical,]}
                    contentContainerStyle={[this.props.contentContainerStyle, styles.marginVertical,]}
                    onLayout={this._onLayout}
                    onContentSizeChange={this._onContentSizeChange}
                    onResponderGrant={this._onResponderGrant}
                    onScroll={this._onScroll}
                    onMomentumScrollBegin={this._onResponderRelease}>
                    {this._renderHeader()}
                    {this.props.children}
                    {this._renderFooter()}
                </ScrollView> :
                <ListView
                    ref={ component => this._scrollView = component }
                    {...this.props}
                    style={[this.props.style, styles.paddingVertical,]}
                    contentContainerStyle={[this.props.contentContainerStyle, styles.marginVertical,]}
                    onEndReached={this._onEndReached}
                    onLayout={this._onLayout}
                    onContentSizeChange={this._onContentSizeChange}
                    onResponderGrant={this._onResponderGrant}
                    onScroll={this._onScroll}
                    onMomentumScrollBegin={this._onResponderRelease}
                    onChangeVisibleRows={this._onChangeVisibleRows}
                    listItemProps={this.props.listItemProps}
                    renderRow={this._renderRow}
                    renderHeader={this._renderHeader}
                    renderFooter={this._renderFooter}
                    renderScrollComponent={ props => <ScrollView ref={ (component) => this._innerScrollView = component } {...props} /> }/>

        )
    }

    componentDidMount () {
        /**
         * (occurs on react-native 0.32, and maybe also occurs on react-native 0.30+)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
         * ScrollView does not exist this strange bug
         */
        if (this.props.viewType == viewType.listView) {
            this._header.setNativeProps({
                style: {
                    height: this._fixedBoundary
                }
            })
            this._headerHeight = this._fixedBoundary

            if (!this.props.autoLoadMore) {
                this._footer.setNativeProps({
                    style: {
                        height: this._fixedBoundary
                    }
                })
            }
        }
    }

    setNativeProps = (props) => {
        this._scrollView.setNativeProps(props)
    }

    beginRefresh = (bounceDisabled) => {
        this._scrollView.setNativeProps({
            scrollEnabled: false
        })
        //this.requestAnimationFrame(this._resetReverseHeaderLayout)
        if (!bounceDisabled) {
            this.requestAnimationFrame(this._resetReverseHeaderLayout)
        }
        else {
            this.props.onRefresh && this.props.onRefresh()
        }
        let {refreshing,} = viewState
        this._refreshState = refreshing
        this._header.setState({
            pullState: this._refreshState,
            pullDistancePercent: 1,
        })

        //force hide footer
        this._footer.setNativeProps({
            style: {
                opacity: 0,
            }
        })

        //this.props.onRefresh && this.props.onRefresh()    //move to _resetReverseHeaderLayout and _resetRefreshScrollTop
        //this._listItemRefs = {}
    }

    endRefresh = (bounceDisabled) => {
        this._onRefreshed = false
        if(!bounceDisabled) {
            this._canLoadMore = false
        }

        //this._scrollView.setNativeProps({
        //    scrollEnabled: false
        //})
        let {refresh_none, loaded_all, load_more_none} = viewState
        let {pullDownStayDistance} = this.props
        this._refreshState = refresh_none
        this._header.setState({
            pullState: this._refreshState,
        })

        this._refreshBackAnimating = true

        //if (this._scrollY < pullDownStayDistance) {
        if (!bounceDisabled && this._scrollY < pullDownStayDistance) {
            this.requestAnimationFrame(this._resetHeaderLayout)
        }
        else {
            this._header.setNativeProps({
                style: {
                    //height: 0,
                    /**
                     * (occurs on react-native 0.32, and maybe also occurs on react-native 0.30+)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
                     * ScrollView does not exist this strange bug
                     */
                    height: this._fixedBoundary,
                }
            })
            this._headerHeight = this._fixedBoundary

            //this._scrollView.scrollTo({ y: this._scrollY - pullDownStayDistance + this._fixedBoundary, animated: false, })
            if (!bounceDisabled) {
                //console.log(`direct endRefresh -> this._scrollY = ${this._scrollY}`)
                this._scrollView.scrollTo({
                    y: this._scrollY - pullDownStayDistance + this._fixedBoundary,
                    animated: false,
                })
            }
            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true

            this._afterDirectRefresh = true

            //force show footer
            this._footer.setNativeProps({
                style: {
                    opacity: 1,
                }
            })

            //this._setPaddingBlank()
            //this._setPaddingBlank(bounceDisabled)

            //reset loadMoreState to load_more_none
            if (this._loadMoreState == loaded_all) {
                this._loadMoreState = load_more_none
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: 0,
                })
            }

            this._scrollView.setNativeProps({
                scrollEnabled: true
            })
        }
    }

    endLoadMore = (loadedAll) => {
        //this._scrollView.setNativeProps({
        //    scrollEnabled: false
        //})

        let {load_more_none, loaded_all} = viewState
        let {autoLoadMore} = this.props
        if (!loadedAll) {
            this._loadMoreState = load_more_none
        }
        else {
            this._loadMoreState = loaded_all
        }
        this._footer.setState({
            pullState: this._loadMoreState,
        })

        if (!autoLoadMore) {
            this._loadMoreBackAnimating = true

            if (this._scrollY >= this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                this.requestAnimationFrame(this._resetFooterLayout)
            }
            else {
                this._footer.setNativeProps({
                    style: {
                        //height: 0,
                        /**
                         * (occurs on react-native 0.32, and maybe also occurs on react-native 0.30+)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
                         * ScrollView does not exist this strange bug
                         */
                        height: this._fixedBoundary,
                    }
                })
                this._scrollView.scrollTo({ y: this._scrollY, animated: false, })

                this._beginTimeStamp = null
                this._loadMoreBackAnimating = false
                this._afterLoadMoreBacked = true

                this._setPaddingBlank()

                this._scrollView.setNativeProps({
                    scrollEnabled: true,
                })
            }
        }
        else {
            this._setPaddingBlank()

            this._scrollView.setNativeProps({
                scrollEnabled: true,
            })
        }
    }

    _setPaddingBlank = (paddingDisabled) => {
        let innerViewRef = this._scrollView.refs.InnerScrollView || this._scrollView._innerViewRef || this._innerScrollView.refs.InnerScrollView || this._innerScrollView._innerViewRef
        innerViewRef.measure((ox, oy, width, height, px, py) => {

            let opacity
            let footerHeight = this.props.autoLoadMore ? this._autoLoadFooterHeight : 0
            //console.log(`footerHeight = ${footerHeight}, height = ${height}, this._paddingBlankDistance = ${this._paddingBlankDistance}, this._headerHeight = ${this._headerHeight}, this._scrollViewContainerHeight = ${this._scrollViewContainerHeight},`)
            if(height - this._paddingBlankDistance - this._headerHeight - footerHeight < this._scrollViewContainerHeight) {
                opacity = 0
                this._canLoadMore = false
            }
            else {
                if(!this._afterDirectRefresh) {
                    opacity = 1
                    this._canLoadMore = true
                }
                else {
                    opacity = 0
                    this._canLoadMore = false
                }

            }

            if (!paddingDisabled && height - this._paddingBlankDistance < this._scrollViewContainerHeight) {
                this._paddingBlankDistance = this._scrollViewContainerHeight - (height - this._paddingBlankDistance)
            }
            else {
                this._paddingBlankDistance = 0
            }

            //this._footer.setNativeProps({
            //    style: {
            //        marginTop: this._paddingBlankDistance,
            //    }
            //})
            /**
             * (occurs on react-native 0.32, and maybe also occurs on react-native 0.30+)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
             * ScrollView does not exist this strange bug
             */
            let {autoLoadMore, enabledPullUp, enabledPullDown, } = this.props
            let ratio = 1 //always includes PullDown
            if (enabledPullUp && !autoLoadMore) {
                ratio++
            }

            if(!this._footer) {
                return
            }

            //console.log(`opacity = ${opacity}, this._canLoadMore = ${this._canLoadMore}, this._paddingBlankDistance = ${this._paddingBlankDistance}, this._afterDirectRefresh = ${this._afterDirectRefresh}`)

            /* (occurs on react-native 0.39, and maybe also occurs on other versions)ListView renderFooter => View's children cannot be visible when parent's marginTop < 0 */
            let marginTop = this._paddingBlankDistance - this._fixedBoundary * ratio
            if(marginTop < 0) {
                marginTop = 0
            }
            this._footer.setNativeProps({
                style: {
                    opacity,
                    marginTop,
                }
            })
        })
    }

    _onLayout = (e) => {
        if (this._scrollViewContainerHeight == null) {
            this._scrollViewContainerHeight = e.nativeEvent.layout.height
        }

        this._setPaddingBlank()

        this.props.onLayout && this.props.onLayout(e)
    }

    //ensure that onContentSizeChange must be triggered while ending resetHeaderLayout/resetFooterLayout animation
    _onContentSizeChange = (contentWidth, contentHeight) => {
        let {refreshing, loading_more} = viewState
        if (this._scrollViewContentHeight == null
            || ((this._refreshState != refreshing && !this._refreshBackAnimating)
                //&& (this._loadMoreState != loading_more && !this._loadMoreBackAnimating))) {
            && ( this.props.autoLoadMore || (!this.props.autoLoadMore && this._loadMoreState != loading_more && !this._loadMoreBackAnimating) ))) {
            this._scrollViewContentHeight = contentHeight

            if (this._afterDirectRefresh) {
                this._afterDirectRefresh = false

                let {pullDownStayDistance} = this.props

                if (this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight + pullDownStayDistance) {
                    let y = this._scrollViewContentHeight - this._scrollViewContainerHeight
                    y = y > 0 ? y : 0
                    this._scrollView.scrollTo({
                        y,
                        animated: false,
                    })
                    //console.log(`_onContentSizeChange y = ${y} this._scrollY = ${this._scrollY} this._scrollViewContentHeight = ${this._scrollViewContentHeight}, this._scrollViewContainerHeight = ${this._scrollViewContainerHeight}`)
                }

                this._setPaddingBlank()
            }
        }

        this.props.onContentSizeChange && this.props.onContentSizeChange(contentWidth, contentHeight)
    }

    _onResponderGrant = (e) => {
        this._touching = true

        if (this._refreshBackAnimationFrame) {
            this.cancelAnimationFrame(this._refreshBackAnimationFrame)
            this._refreshBackAnimationFrame = null
            this._beginResetScrollTopTimeStamp = null

            if(!this._onRefreshed) {
                this._onRefreshed = true
                this.props.onRefresh && this.props.onRefresh()
            }
        }

        if (this._afterRefreshBacked) {
            this._afterRefreshBacked = false
        }
        if (this._afterLoadMoreBacked) {
            this._afterLoadMoreBacked = false
        }

        if (e.nativeEvent.contentOffset) {
            this._scrollY = e.nativeEvent.contentOffset.y
            this._lastScrollY = this._scrollY
        }

        let {refresh_idle, refreshing, load_more_idle, loading_more, loaded_all} = viewState
        let {enabledPullUp, enabledPullDown, pullUpDistance, pullDownDistance, autoLoadMore, } = this.props
        if (enabledPullDown && this._refreshState != refreshing && this._loadMoreState != loading_more && this._scrollY < 0) {
            this._refreshState = refresh_idle
            this._header.setState({
                pullState: this._refreshState,
                pullDistancePercent: -this._scrollY / pullDownDistance,
            })
        }
        else {
            if (this._canLoadMore && !autoLoadMore && enabledPullUp && this._refreshState != refreshing && this._loadMoreState != loading_more && this._loadMoreState != loaded_all && this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                this._loadMoreState = load_more_idle
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: (this._scrollY - this._scrollViewContentHeight + this._scrollViewContainerHeight) / pullUpDistance,
                })
            }
        }
    }

    _onScroll = (e) => {
        let {refresh_none, refresh_idle, will_refresh, refreshing,
            load_more_none, load_more_idle, will_load_more, loading_more, loaded_all,} = viewState
        let {pullUpDistance, pullDownDistance, autoLoadMore, enabledPullUp, enabledPullDown, } = this.props
        this._scrollY = e.nativeEvent.contentOffset.y
        //console.log(`this._scrollY = ${this._scrollY}`)

        if (this._scrollY < this._lastScrollY) {
            if (this._refreshState == refresh_none && !this._refreshBackAnimating && !this._afterRefreshBacked) {
                if (enabledPullDown && this._refreshState != refreshing && this._loadMoreState != loading_more && this._scrollY < 0) {
                    this._refreshState = refresh_idle
                    this._header.setState({
                        pullState: this._refreshState,
                        pullDistancePercent: -this._scrollY / pullDownDistance,
                    })
                }
            }
        }
        else {
            if (this._loadMoreState == load_more_none && !this._loadMoreBackAnimating && !this._afterLoadMoreBacked) {
                if (this._canLoadMore && enabledPullUp && !autoLoadMore && this._refreshState != refreshing && this._loadMoreState != loading_more && this._loadMoreState != loaded_all && this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                    this._loadMoreState = load_more_idle
                    this._footer.setState({
                        pullState: this._loadMoreState,
                        pullDistancePercent: (this._scrollY - this._scrollViewContentHeight + this._scrollViewContainerHeight) / pullUpDistance,
                    })
                }
            }
        }

        if (this._scrollY < 0) {
            if (this._refreshState == refresh_idle || this._refreshState == will_refresh) {
                if (-this._scrollY >= pullDownDistance) {
                    if (this._refreshState == refresh_idle) {
                        this._refreshState = will_refresh
                    }
                }
                else {
                    if (this._refreshState == will_refresh) {
                        this._refreshState = refresh_idle
                    }
                }
                this._header.setState({
                    pullState: this._refreshState,
                    pullDistancePercent: -this._scrollY / pullDownDistance,
                })
            }
        }
        else if (!autoLoadMore && this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight) {
            if (this._loadMoreState == load_more_idle || this._loadMoreState == will_load_more) {
                if (this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight + pullUpDistance) {
                    if (this._loadMoreState == load_more_idle) {
                        this._loadMoreState = will_load_more
                    }
                }
                else {
                    if (this._loadMoreState == will_load_more) {
                        this._loadMoreState = load_more_idle
                    }
                }
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: (this._scrollY - this._scrollViewContentHeight + this._scrollViewContainerHeight) / pullUpDistance,
                })
            }
        }
        else {
            if (this._scrollY == 0) {
                if (this._refreshState == refresh_idle) {
                    this._refreshState = refresh_none
                    this._header.setState({
                        pullState: this._refreshState,
                    })

                }
            }
            else {
                if (!autoLoadMore) {
                    if (withinErrorMargin(this._scrollY, this._scrollViewContentHeight - this._scrollViewContainerHeight)) {
                        if (this._loadMoreState == load_more_idle) {
                            this._loadMoreState = load_more_none
                            this._footer.setState({
                                pullState: this._loadMoreState,
                            })
                        }
                    }
                }
                else {
                    //use onEndReached handler when viewType is 'listView' to fix double triggering onLoadMore sometimes, but no idea when viewType is 'scrollView'
                    if (this.props.viewType == viewType.scrollView) {
                        if (withinErrorMargin(this._scrollY, this._scrollViewContentHeight - this._scrollViewContainerHeight, this.props.onEndReachedThreshold)
                            || this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight - this.props.onEndReachedThreshold) {
                            if (this._refreshState != refreshing && this._loadMoreState == load_more_none) {
                                this._loadMoreState = loading_more
                                this._footer.setState({
                                    pullState: this._loadMoreState,
                                })

                                this.props.onLoadMore && this.props.onLoadMore()
                            }
                        }
                    }
                }
            }
        }

        this._lastScrollY = this._scrollY

        this.props.onScroll && this.props.onScroll(e)
    }

    _onResponderRelease = (e) => {
        this._touching = false

        let {will_refresh, refreshing, will_load_more, loading_more} = viewState

        if (this._loadMoreState != loading_more && this._refreshState == will_refresh && !this._refreshBackAnimating && !this._afterRefreshBacked) {
            let {pullDownStayDistance} = this.props
            this._refreshFixScrollY = this._scrollY + pullDownStayDistance
            this._header.setNativeProps({
                style: {
                    height: pullDownStayDistance,
                }
            })
            this._headerHeight = pullDownStayDistance

            this._scrollView.scrollTo({ y: this._refreshFixScrollY, animated: false, })
            this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetRefreshScrollTop)
            this._refreshState = refreshing
            this._header.setState({
                pullState: this._refreshState,
                pullDistancePercent: 0,
            })

            //this.props.onRefresh && this.props.onRefresh()    //move to _resetReverseHeaderLayout and _resetRefreshScrollTop
            //this._listItemRefs = {}
        }
        else {
            if (this._refreshState != refreshing && this._loadMoreState == will_load_more && !this._loadMoreBackAnimating && !this._afterLoadMoreBacked) {
                let {pullUpStayDistance} = this.props
                this._footer.setNativeProps({
                    style: {
                        height: pullUpStayDistance,
                    }
                })
                this._loadMoreState = loading_more
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: 0,
                })

                this.props.onLoadMore && this.props.onLoadMore()
            }
        }
    }

    _resetRefreshScrollTop = (timestamp) => {
        if (!this._beginResetScrollTopTimeStamp) {
            this._beginResetScrollTopTimeStamp = timestamp
            this._scrollView.scrollTo({ y: this._refreshFixScrollY, animated: false, })
        }
        else {
            let percent = (timestamp - this._beginResetScrollTopTimeStamp) / scrollBounceAnimationDuration
            let resetScrollTop
            resetScrollTop = -this._refreshFixScrollY - -this._refreshFixScrollY * easeOutCirc(percent, scrollBounceAnimationDuration * percent, 0, 1, scrollBounceAnimationDuration)
            if (resetScrollTop < 0) {
                resetScrollTop = 0
            }
            this._scrollView.scrollTo({ y: -resetScrollTop, animated: false, })
            if (timestamp - this._beginResetScrollTopTimeStamp > scrollBounceAnimationDuration) {
                this._refreshBackAnimationFrame = null
                this._beginResetScrollTopTimeStamp = null

                if(!this._onRefreshed) {
                    this._onRefreshed = true
                    this.props.onRefresh && this.props.onRefresh()
                }

                return
            }
        }
        this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetRefreshScrollTop)
    }

    _resetReverseHeaderLayout = (timestamp) => {
        let {pullDownStayDistance} = this.props
        let headerHeight
        if (!this._beginTimeStamp) {
            headerHeight = pullDownStayDistance
            this._beginTimeStamp = timestamp
        }
        else {
            headerHeight = pullDownStayDistance * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            if (headerHeight > pullDownStayDistance) {
                headerHeight = pullDownStayDistance
            }
        }
        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })
        this._headerHeight = headerHeight

        if (timestamp - this._beginTimeStamp > refreshAnimationDuration) {
            this._header.setNativeProps({
                style: {
                    height: pullDownStayDistance,
                }
            })
            this._headerHeight = pullDownStayDistance

            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true

            this.props.onRefresh && this.props.onRefresh()

            return
        }

        this.requestAnimationFrame(this._resetReverseHeaderLayout)
    }

    _resetHeaderLayout = (timestamp) => {
        let {loaded_all, load_more_none} = viewState
        let {pullDownStayDistance} = this.props
        let headerHeight
        if (!this._beginTimeStamp) {
            headerHeight = pullDownStayDistance
            this._beginTimeStamp = timestamp
            this._fixedScrollY = this._scrollY > 0 ? this._scrollY : 0

            let opacity = 0
            this._footer.setNativeProps({
                style: {
                    opacity,
                }
            })
        }
        else {
            //headerHeight = pullDownStayDistance - (pullDownStayDistance - this._fixedScrollY) * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            headerHeight = pullDownStayDistance - (pullDownStayDistance - this._fixedScrollY - this._fixedBoundary - StyleSheet.hairlineWidth) * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            //if (headerHeight < 0) {
            //    headerHeight = 0
            //}
            /**
             * fix the bug that onContentSizeChange sometimes is not triggered, it causes incorrect contentHeight(this._scrollViewContentHeight)
             */
            if (headerHeight < this._fixedBoundary + StyleSheet.hairlineWidth) {
                headerHeight = this._fixedBoundary + StyleSheet.hairlineWidth
            }
        }
        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })
        this._headerHeight = headerHeight

        if (timestamp - this._beginTimeStamp > refreshAnimationDuration) {
            this._header.setNativeProps({
                style: {
                    //height: 0,
                    /**
                     * (occurs on react-native 0.32, and maybe also occurs on react-native 0.30+)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
                     * ScrollView does not exist this strange bug
                     */
                    height: this._fixedBoundary
                }
            })
            this._headerHeight = this._fixedBoundary

            //console.log(`this._fixedScrollY = ${this._fixedScrollY}, this._scrollY = ${this._scrollY}`)
            if (this._fixedScrollY > 0) {
                this._scrollView.scrollTo({ y: 0, animated: false, })
            }
            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true

            //force show footer
            this._footer.setNativeProps({
                style: {
                    opacity: 1,
                }
            })

            this._setPaddingBlank()

            //reset loadMoreState to load_more_none
            if (this._loadMoreState == loaded_all) {
                this._loadMoreState = load_more_none
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: 0,
                })
            }

            this._scrollView.setNativeProps({
                scrollEnabled: true
            })

            return
        }

        this.requestAnimationFrame(this._resetHeaderLayout)
    }

    _resetFooterLayout = (timestamp) => {
        let {pullUpStayDistance} = this.props
        let footerHeight, scrollViewTranslateY
        if (!this._beginTimeStamp) {
            footerHeight = pullUpStayDistance
            scrollViewTranslateY = 0
            this._beginTimeStamp = timestamp
            this._fixedScrollY = this._scrollY
        }
        else {
            let scrollViewTranslateMaxY
            //footerHeight = pullUpStayDistance - pullUpStayDistance * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            footerHeight = pullUpStayDistance - (pullUpStayDistance - this._fixedBoundary - StyleSheet.hairlineWidth) * (timestamp - this._beginTimeStamp) / refreshAnimationDuration

            if (this._touching && (this._fixedScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)) > pullUpStayDistance) {
                scrollViewTranslateMaxY = pullUpStayDistance
            }
            else {
                scrollViewTranslateMaxY = this._fixedScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)
            }
            scrollViewTranslateY = (scrollViewTranslateMaxY - this._fixedBoundary - StyleSheet.hairlineWidth) * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            //if (footerHeight < 0) {
            //    footerHeight = 0
            //}
            //if (scrollViewTranslateY > scrollViewTranslateMaxY) {
            //    scrollViewTranslateY = scrollViewTranslateMaxY
            //}
            /**
             * fix the bug that onContentSizeChange sometimes is not triggered, it causes incorrect contentHeight(this._scrollViewContentHeight)
             */
            if (footerHeight < this._fixedBoundary + StyleSheet.hairlineWidth) {
                footerHeight = this._fixedBoundary + StyleSheet.hairlineWidth
            }
            if (scrollViewTranslateY > scrollViewTranslateMaxY - this._fixedBoundary - StyleSheet.hairlineWidth) {
                scrollViewTranslateY = scrollViewTranslateMaxY - this._fixedBoundary - StyleSheet.hairlineWidth
            }
        }

        this._footer.setNativeProps({
            style: {
                height: footerHeight,
            }
        })
        this._scrollView.scrollTo({ y: this._fixedScrollY - scrollViewTranslateY, animated: false, })

        if (timestamp - this._beginTimeStamp > refreshAnimationDuration) {
            /**
             * (occurs on react-native 0.32, and maybe also occurs on react-native 0.30+)ListView renderHeader/renderFooter => View's children cannot be visible when parent's height < StyleSheet.hairlineWidth
             * ScrollView does not exist this strange bug
             */
            this._footer.setNativeProps({
                style: {
                    height: this._fixedBoundary,
                }
            })
            this._scrollView.scrollTo({
                y: this._fixedScrollY - scrollViewTranslateY + StyleSheet.hairlineWidth,
                animated: false,
            })

            this._beginTimeStamp = null
            this._loadMoreBackAnimating = false
            this._afterLoadMoreBacked = true

            this._setPaddingBlank()

            this._scrollView.setNativeProps({
                scrollEnabled: true,
            })

            return
        }

        this.requestAnimationFrame(this._resetFooterLayout)
    }

    _renderHeader = () => {
        return (
            <RefreshView ref={ component => this._header = component }
                         style={[styles.header, styles.shrink,]}
                         viewType={refreshViewType.header}
                         renderRefreshContent={this.props.renderHeader}/>
        )
    }

    _renderFooter = () => {
        return (
            <RefreshView ref={ component => this._footer = component }
                         onLayout={this._onFooterLayout}
                         style={[styles.footer, this.props.autoLoadMore ? null : styles.shrink, { opacity: 0, }, ]}
                         viewType={refreshViewType.footer}
                         renderRefreshContent={this.props.renderFooter}/>
        )
    }

    _onFooterLayout = (e) => {
        this._autoLoadFooterHeight = e.nativeEvent.layout.height
    }

    //only used by listview
    _renderRow = (rowData, sectionID, rowID) => {
        let {listItemProps, renderRow,} = this.props
        if (listItemProps) {
            return (
                <ListItem ref={ component => this._listItemRefs[rowID] = component} {...listItemProps}>
                    {renderRow(rowData, sectionID, rowID)}
                </ListItem>
            )
        }
        else {
            return renderRow(rowData, sectionID, rowID)
        }
    }

    //only used by listview
    _onChangeVisibleRows = (visibleRows, changedRows) => {
        let {listItemProps, onChangeVisibleRows,} = this.props
        if (listItemProps) {
            Object.keys(changedRows).forEach(sectionID => {
                let section = changedRows[ sectionID ]
                Object.keys(section).forEach(rowID => {
                    let listItemRef = this._listItemRefs[ rowID ];
                    if (section[ rowID ]) {
                        //console.log(`show rowID = ${rowID}`)
                        listItemRef.show()
                    }
                    else {
                        //console.log(`hide rowID = ${rowID}`)
                        listItemRef.hide()
                    }
                })
            })
        }
        onChangeVisibleRows && onChangeVisibleRows(visibleRows, changedRows)
    }

    clearListRowRefsCache = () => {
        this._listItemRefs = {}
    }
}

export default TimerEnhance(PullToRefreshListView)
