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
    ActivityIndicator,
    ProgressBarAndroid,
    ActivityIndicatorIOS,
    Platform,
    RecyclerViewBackedScrollView
} from 'react-native'

import TimerEnhance from '../react-native-smart-timer-enhance'
import constants from './constants'
import easing from './easing'
import RefreshView from './RefreshView'

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
        viewType: constants.viewType.scrollView,
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
        renderScrollComponent: props => <RecyclerViewBackedScrollView {...props} />,
        onEndReachedThreshold: 0,
    }

    static propTypes = {
        ...ListView.propTypes,
        viewType: PropTypes.oneOf([
            constants.viewType.scrollView,
            constants.viewType.listView,
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
        let {refresh_none, load_more_none} = constants.viewState
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
        this._refreshFixScrollY = 0
        this._paddingBlankDistance = 0
    }

    render () {
        return (
            this.props.viewType == constants.viewType.scrollView ?
                <ScrollView
                    ref={ component => this._scrollView = component }
                    {...this.props}
                    style={[this.props.style, styles.paddingVertical,]}
                    contentContainerStyle={[this.props.contentContainerStyle, styles.marginVertical,]}
                    onLayout={this._onLayout}
                    onContentSizeChange={this._onContentSizeChange}
                    onResponderGrant={this._onResponderGrant}
                    onScroll={this._onScroll}
                    onResponderRelease={this._onResponderRelease}>
                    {this._renderHeader()}
                    {this.props.children}
                    {this._renderFooter()}
                </ScrollView> :
                <ListView
                    ref={ component => this._scrollView = component }
                    {...this.props}
                    style={[this.props.style, styles.paddingVertical,]}
                    contentContainerStyle={[this.props.contentContainerStyle, styles.marginVertical,]}
                    onLayout={this._onLayout}
                    onContentSizeChange={this._onContentSizeChange}
                    onResponderGrant={this._onResponderGrant}
                    onScroll={this._onScroll}
                    onResponderRelease={this._onResponderRelease}
                    renderHeader={this._renderHeader}
                    renderFooter={this._renderFooter}
                    renderScrollComponent={ props => <RecyclerViewBackedScrollView ref={ (component) => this._innerScrollView = component } {...props} /> }/>
        )
    }

    setNativeProps = (props) => {
        this._scrollView.setNativeProps(props)
    }

    beginRefresh = () => {
        this._scrollView.setNativeProps({
            scrollEnabled: false
        })
        this.requestAnimationFrame(this._resetReverseHeaderLayout)
        let {refreshing,} = constants.viewState
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

        this.props.onRefresh && this.props.onRefresh()
    }

    endRefresh = () => {
        this._scrollView.setNativeProps({
            scrollEnabled: true
        })
        let {refresh_none, loaded_all, load_more_none} = constants.viewState
        let {pullUpStayDistance} = this.props
        this._refreshState = refresh_none
        this._header.setState({
            pullState: this._refreshState,
        })

        this._refreshBackAnimating = true

        if (this._scrollY < pullUpStayDistance) {
            this.requestAnimationFrame(this._resetHeaderLayout)
        }
        else {
            this._header.setNativeProps({
                style: {
                    height: 0,
                }
            })
            this._scrollView.scrollTo({ y: this._scrollY - pullUpStayDistance, animated: false, })
            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true

            this._setPaddingBlank()

            //force show footer
            this._footer.setNativeProps({
                style: {
                    opacity: 1,
                }
            })

            //reset loadMoreState to load_more_none
            if(this._loadMoreState == loaded_all) {
                this._loadMoreState = load_more_none
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: 0,
                })
            }

        }
    }

    endLoadMore = (loadedAll) => {
        let {load_more_none, loaded_all} = constants.viewState
        let {autoLoadMore} = this.props
        if(!loadedAll) {
            this._loadMoreState = load_more_none
        }
        else {
            this._loadMoreState = loaded_all
        }
        this._footer.setState({
            pullState: this._loadMoreState,
        })

        if(!autoLoadMore) {
            this._loadMoreBackAnimating = true

            if (this._scrollY >= this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                this.requestAnimationFrame(this._resetFooterLayout)
            }
            else {
                this._footer.setNativeProps({
                    style: {
                        height: 0,
                    }
                })
                this._scrollView.scrollTo({ y: this._scrollY, animated: false, })

                this._beginTimeStamp = null
                this._loadMoreBackAnimating = false
                this._afterLoadMoreBacked = true

                this._setPaddingBlank()
            }
        }
        else {
            this._setPaddingBlank()
        }
    }

    _setPaddingBlank = () => {
        let innerViewRef = this._scrollView._innerViewRef || this._innerScrollView._innerViewRef
        innerViewRef.measure((ox, oy, width, height, px, py) => {
            if (height - this._paddingBlankDistance < this._scrollViewContainerHeight) {
                this._paddingBlankDistance = this._scrollViewContainerHeight - (height - this._paddingBlankDistance)
            }
            else {
                this._paddingBlankDistance = 0
            }
            this._footer.setNativeProps({
                style: {
                    marginTop: this._paddingBlankDistance,
                }
            })
        })
    }

    _onLayout = (e) => {
        if (this._scrollViewContainerHeight == null) {
            this._scrollViewContainerHeight = e.nativeEvent.layout.height

            console.log('_onLayout...this._scrollViewContainerHeight = ' + this._scrollViewContainerHeight)
        }

        this._setPaddingBlank()

        this.props.onLayout && this.props.onLayout(e)
    }

    _onContentSizeChange = (contentWidth, contentHeight) => {
        let {refreshing, loading_more} = constants.viewState
        if (this._scrollViewContentHeight == null
            || (this._refreshState != refreshing && !this._refreshBackAnimating)
            && (this._loadMoreState != loading_more && !this._loadMoreBackAnimating)) {
            console.log('_onContentSizeChange...contentHeight = ' + contentHeight)
            this._scrollViewContentHeight = contentHeight
        }

        this.props.onContentSizeChange && this.props.onContentSizeChange(contentWidth, contentHeight)
    }

    _onResponderGrant = (e) => {
        this._touching = true

        if (this._refreshBackAnimationFrame) {
            cancelAnimationFrame(this._refreshBackAnimationFrame)
            this._beginResetScrollTopTimeStamp = null
        }

        if (this._afterRefreshBacked) {
            this._afterRefreshBacked = false
        }
        else {
            if (this._afterLoadMoreBacked) {
                this._afterLoadMoreBacked = false
            }
        }

        if (e.nativeEvent.contentOffset) {
            this._scrollY = e.nativeEvent.contentOffset.y
        }

        let {refresh_idle, refreshing, load_more_idle, loading_more, loaded_all} = constants.viewState
        let {enabledPullUp, enabledPullDown, pullUpDistance, pullDownDistance,} = this.props
        if (enabledPullUp && this._refreshState != refreshing && this._loadMoreState != loading_more && this._scrollY < 0) {
            this._refreshState = refresh_idle
            this._header.setState({
                pullState: this._refreshState,
                pullDistancePercent: -this._scrollY / pullUpDistance,
            })
        }
        else {
            if (enabledPullDown && this._refreshState != refreshing && this._loadMoreState != loading_more && this._loadMoreState != loaded_all && this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                this._loadMoreState = load_more_idle
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: (this._scrollY - this._scrollViewContentHeight + this._scrollViewContainerHeight) / pullDownDistance,
                })
            }
        }
    }

    _onScroll = (e) => {
        let {refresh_none, refresh_idle, will_refresh, refreshing,
            load_more_none, load_more_idle, will_load_more, loading_more, } = constants.viewState
        let {pullUpDistance, pullDownDistance, autoLoadMore,} = this.props
        this._scrollY = e.nativeEvent.contentOffset.y

        console.log('this._scrollY = ' + this._scrollY)

        if (this._scrollY < 0) {
            if (this._refreshState == refresh_idle || this._refreshState == will_refresh) {
                if (-this._scrollY >= pullUpDistance) {
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
                    pullDistancePercent: -this._scrollY / pullUpDistance,
                })
            }
        }
        else if (!autoLoadMore && this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight) {
            if (this._loadMoreState == load_more_idle || this._loadMoreState == will_load_more) {
                if (this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight + pullDownDistance) {
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
                    pullDistancePercent: (this._scrollY - this._scrollViewContentHeight + this._scrollViewContainerHeight) / pullDownDistance,
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
                if(!autoLoadMore) {
                    if (this._scrollY == this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                        if (this._loadMoreState == load_more_idle) {
                            this._loadMoreState = load_more_none
                            this._footer.setState({
                                pullState: this._loadMoreState,
                            })
                        }
                    }
                }
                else {
                    if (this._scrollY >= this._scrollViewContentHeight - this._scrollViewContainerHeight - this.props.onEndReachedThreshold) {
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

        this.props.onScroll && this.props.onScroll(e)
    }

    _onResponderRelease = (e) => {
        this._touching = false

        let {will_refresh, refreshing, will_load_more, loading_more} = constants.viewState

        if (this._loadMoreState != loading_more && this._refreshState == will_refresh && !this._refreshBackAnimating && !this._afterRefreshBacked) {
            let {pullUpStayDistance} = this.props
            this._refreshFixScrollY = this._scrollY + pullUpStayDistance
            this._header.setNativeProps({
                style: {
                    height: pullUpStayDistance,
                }
            })
            //this._scrollView.scrollTo({ y: this._refreshFixScrollY, animated: false, })
            //this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetRefreshScrollTop)
            this._refreshState = refreshing
            this._header.setState({
                pullState: this._refreshState,
                pullDistancePercent: 0,
            })

            this.props.onRefresh && this.props.onRefresh()
        }
        else {
            if (this._refreshState != refreshing && this._loadMoreState == will_load_more && !this._loadMoreBackAnimating && !this._afterLoadMoreBacked) {
                let {pullDownStayDistance} = this.props
                this._footer.setNativeProps({
                    style: {
                        height: pullDownStayDistance,
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
            let percent = (timestamp - this._beginResetScrollTopTimeStamp) / constants.scrollBounceAnimationDuration
            let resetScrollTop
            resetScrollTop = -this._refreshFixScrollY - -this._refreshFixScrollY * easing.easeOutCirc(percent, constants.scrollBounceAnimationDuration * percent, 0, 1, constants.scrollBounceAnimationDuration)
            if (resetScrollTop < 0) {
                resetScrollTop = 0
            }
            this._scrollView.scrollTo({ y: -resetScrollTop, animated: false, })
            if (timestamp - this._beginResetScrollTopTimeStamp > constants.scrollBounceAnimationDuration) {
                this._beginResetScrollTopTimeStamp = null
                return
            }
        }
        this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetRefreshScrollTop)
    }

    _resetReverseHeaderLayout = (timestamp) => {
        let {pullUpStayDistance} = this.props
        let headerHeight
        if (!this._beginTimeStamp) {
            headerHeight = pullUpStayDistance
            this._beginTimeStamp = timestamp
        }
        else {
            headerHeight = pullUpStayDistance * (timestamp - this._beginTimeStamp) / constants.refreshAnimationDuration
            if (headerHeight > pullUpStayDistance) {
                headerHeight = pullUpStayDistance
            }
        }
        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })

        if (timestamp - this._beginTimeStamp > constants.refreshAnimationDuration) {
            this._header.setNativeProps({
                style: {
                    height: pullUpStayDistance,
                }
            })
            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true
            return
        }

        this.requestAnimationFrame(this._resetReverseHeaderLayout)
    }

    _resetHeaderLayout = (timestamp) => {
        let {loaded_all, load_more_none} = constants.viewState
        let {pullUpStayDistance} = this.props
        let headerHeight
        if (!this._beginTimeStamp) {
            headerHeight = pullUpStayDistance
            this._beginTimeStamp = timestamp
            this._lastScrollY = this._scrollY > 0 ? this._scrollY : 0
        }
        else {
            headerHeight = pullUpStayDistance - (pullUpStayDistance - this._lastScrollY) * (timestamp - this._beginTimeStamp) / constants.refreshAnimationDuration
            if (headerHeight < 0) {
                headerHeight = 0
            }
        }
        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })

        if (timestamp - this._beginTimeStamp > constants.refreshAnimationDuration) {
            this._header.setNativeProps({
                style: {
                    height: 0,
                }
            })
            if (this._lastScrollY > 0) {
                this._scrollView.scrollTo({ y: 0, animated: false, })
            }
            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true

            this._setPaddingBlank()

            //force show footer
            this._footer.setNativeProps({
                style: {
                    opacity: 1,
                }
            })

            //reset loadMoreState to load_more_none
            if(this._loadMoreState == loaded_all) {
                this._loadMoreState = load_more_none
                this._footer.setState({
                    pullState: this._loadMoreState,
                    pullDistancePercent: 0,
                })
            }

            return
        }

        this.requestAnimationFrame(this._resetHeaderLayout)
    }

    _resetFooterLayout = (timestamp) => {
        let {pullDownStayDistance} = this.props
        let footerHeight, scrollViewTranslateY
        if (!this._beginTimeStamp) {
            footerHeight = pullDownStayDistance
            scrollViewTranslateY = 0
            this._beginTimeStamp = timestamp
            this._lastScrollY = this._scrollY
        }
        else {
            let scrollViewTranslateMaxY
            footerHeight = pullDownStayDistance - pullDownStayDistance * (timestamp - this._beginTimeStamp) / constants.refreshAnimationDuration

            if (this._touching && (this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)) > pullDownStayDistance) {
                scrollViewTranslateMaxY = pullDownStayDistance
            }
            else {
                scrollViewTranslateMaxY = this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)
            }
            scrollViewTranslateY = scrollViewTranslateMaxY * (timestamp - this._beginTimeStamp) / constants.refreshAnimationDuration
            if (footerHeight < 0) {
                footerHeight = 0
            }
            if (scrollViewTranslateY > scrollViewTranslateMaxY) {
                scrollViewTranslateY = scrollViewTranslateMaxY
            }
        }

        this._footer.setNativeProps({
            style: {
                height: footerHeight,
            }
        })

        this._scrollView.scrollTo({ y: this._lastScrollY - scrollViewTranslateY, animated: false, })

        if (timestamp - this._beginTimeStamp > constants.refreshAnimationDuration) {
            this._beginTimeStamp = null
            this._loadMoreBackAnimating = false
            this._afterLoadMoreBacked = true

            this._setPaddingBlank()

            return
        }

        this.requestAnimationFrame(this._resetFooterLayout)
    }

    _renderHeader = () => {
        return (
            <RefreshView ref={ component => this._header = component }
                         style={[styles.header, styles.shrink,]}
                         viewType={constants.refreshViewType.header}
                         renderRefreshContent={this.props.renderHeader}/>
        )
    }

    _renderFooter = () => {
        return (
            <RefreshView ref={ component => this._footer = component }
                         style={[styles.footer, this.props.autoLoadMore ? null : styles.shrink,]}
                         viewType={constants.refreshViewType.footer}
                         renderRefreshContent={this.props.renderFooter}/>
        )
    }

}

export default TimerEnhance(PullToRefreshListView)