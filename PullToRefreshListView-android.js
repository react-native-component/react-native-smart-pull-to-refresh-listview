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
import AndroidSwipeRefreshLayout from './AndroidSwipeRefreshLayout'

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
        renderScrollComponent: props => <RecyclerViewBackedScrollView {...props} />,
        onEndReachedThreshold: 0,
    }

    static propTypes = {
        ...ListView.propTypes,
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
    }

    render () {
        return (
            <AndroidSwipeRefreshLayout
                ref={ component => this._swipeRefreshLayout = component }
                style={{flex: 1,}}
                enabledPullUp={this.props.enabledPullUp}
                enabledPullDown={this.props.enabledPullDown}
                onSwipe={this._onSwipe}
                onRefresh={this._onRefresh}>
                { this.props.viewType == viewType.scrollView ?
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
                        renderScrollComponent={ props => <RecyclerViewBackedScrollView ref={ (component) => this._innerScrollView = component } {...props} /> }/> }
                </AndroidSwipeRefreshLayout>
        )
    }

    setNativeProps = (props) => {
        this._scrollView.setNativeProps(props)
    }

    beginRefresh = () => {
        this._swipeRefreshLayout.setNativeProps({
            refreshing: true,
        })
        this._scrollView.setNativeProps({
            scrollEnabled: false,
        })
        this.requestAnimationFrame(this._resetReverseHeaderLayout)
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

        this.props.onRefresh && this.props.onRefresh()
    }

    endRefresh = () => {
        let {refresh_none, loaded_all, load_more_none} = viewState
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
            this._swipeRefreshLayout.setNativeProps({
                refreshing: false,
            })
            this._scrollView.setNativeProps({
                scrollEnabled: true,
            })
            this._header.setNativeProps({
                style: {
                    height: 0,
                }
            })

            this._scrollView.scrollTo({ y: this._scrollY - pullUpStayDistance, animated: false, })
            this._beginTimeStamp = null
            this._refreshBackAnimating = false
            this._afterRefreshBacked = true

            this._afterDirectRefresh = true

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
        let {load_more_none, loaded_all} = viewState
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
                this._swipeRefreshLayout.setNativeProps({
                    refreshing: false,
                })
                this._scrollView.setNativeProps({
                    scrollEnabled: true,
                })
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

    _onSwipe = (movement) => {

        this._touching = true

        if(this._refreshBackAnimationFrame) {
            this._beginResetScrollTopTimeStamp = null
            this._moveMent = 0
            this.cancelAnimationFrame(this._refreshBackAnimationFrame)
        }

        let {refresh_none, refresh_idle, will_refresh, refreshing,
            load_more_none, load_more_idle, will_load_more, loading_more, loaded_all,} = viewState
        let {pullUpDistance, pullDownDistance, autoLoadMore, enabledPullUp, enabledPullDown, } = this.props

        if(movement > 0) {
            if(enabledPullUp) {
                if(this._refreshState == refresh_none) {
                    this._refreshState = refresh_idle
                }
                this._header.setNativeProps({
                    style: {
                        height: movement,
                    },
                })

                this._moveMent = movement
                this._lastMoveMent = movement

                if (this._refreshState == refresh_idle || this._refreshState == will_refresh) {
                    if (movement >= pullUpDistance) {
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
                        pullDistancePercent: movement / pullUpDistance,
                    })
                }


            }
        }
        else if(movement < 0) {
            if(enabledPullDown && !autoLoadMore) {
                if(this._loadMoreState == load_more_none) {
                     this._loadMoreState = load_more_idle
                    this._footer.setState({
                        pullState: this._loadMoreState,
                        pullDistancePercent: Math.abs(movement) / pullDownDistance,
                    })
                }

                this._footer.setNativeProps({
                    style: {
                        height: Math.abs(movement),
                    },
                })
                this._scrollView.scrollTo({ y: this._scrollY + Math.abs(movement) / 2, animated: false, })

                this._moveMent = movement
                this._lastMoveMent = movement

                if (this._loadMoreState == load_more_idle || this._loadMoreState == will_load_more) {
                    if (Math.abs(movement) > pullDownDistance) {
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
                        pullDistancePercent: Math.abs(movement) / pullDownDistance,
                    })
                }
            }
        }
        else {
            if(this._lastMoveMent > 0) {
                this._header.setNativeProps({
                    style: {
                        height: 0,
                    },
                })
            }
            else {
                this._footer.setNativeProps({
                    style: {
                        height: 0,
                    },
                })
                this._scrollView.scrollTo({ y: this._scrollY, animated: false, })
            }
        }
    }

    _onRefresh = () => {
        this._touching = false

        if(this._moveMent > 0) {
            let {will_refresh, refreshing, } = viewState

            if (this._refreshState == will_refresh) {
                //disable swipe event
                this._swipeRefreshLayout.setNativeProps({
                    refreshing: true,
                })

                this._refreshState = refreshing
                this._header.setState({
                    pullState: this._refreshState,
                    pullDistancePercent: 0,
                })

                this.props.onRefresh && this.props.onRefresh()
            }

            this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetRefreshScrollTop)
        }
        else {
            if(this._moveMent < 0) {
                let {will_load_more, loading_more, } = viewState
                if (this._loadMoreState == will_load_more) {
                    //disable swipe event
                    this._swipeRefreshLayout.setNativeProps({
                        refreshing: true,
                    })

                    this._loadMoreState = loading_more
                    this._footer.setState({
                        pullState: this._loadMoreState,
                        pullDistancePercent: 0,
                    })

                    this.props.onLoadMore && this.props.onLoadMore()
                }

                this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetLoadMoreScrollTop)
            }
        }
    }

    _setPaddingBlank = () => {
        let innerViewRef = this._scrollView.refs.InnerScrollView || this._scrollView._innerViewRef || this._innerScrollView.refs.InnerView
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
        }

        this._setPaddingBlank()

        this.props.onLayout && this.props.onLayout(e)
    }

    _onContentSizeChange = (contentWidth, contentHeight) => {
        let {refreshing, loading_more} = viewState
        if (this._scrollViewContentHeight == null
            || ((this._refreshState != refreshing && !this._refreshBackAnimating)
            && (this._loadMoreState != loading_more && !this._loadMoreBackAnimating))) {
            this._scrollViewContentHeight = contentHeight

            if(this._afterDirectRefresh) {
                this._afterDirectRefresh = false

                let {pullUpStayDistance} = this.props

                if(this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight + pullUpStayDistance) {
                    this._scrollView.scrollTo({y: this._scrollViewContentHeight - this._scrollViewContainerHeight, animated: false, })
                }

            }


        }

        this.props.onContentSizeChange && this.props.onContentSizeChange(contentWidth, contentHeight)
    }

    _onScroll = (e) => {
        this._scrollY = e.nativeEvent.contentOffset.y
    }

    _resetReverseHeaderLayout = (timestamp) => {
        let {pullUpStayDistance} = this.props
        let headerHeight
        if (!this._beginTimeStamp) {
            headerHeight = pullUpStayDistance
            this._beginTimeStamp = timestamp
        }
        else {
            headerHeight = pullUpStayDistance * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            if (headerHeight > pullUpStayDistance) {
                headerHeight = pullUpStayDistance
            }
        }
        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })

        if (timestamp - this._beginTimeStamp > refreshAnimationDuration) {
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

    _resetRefreshScrollTop = (timestamp) => {
        let {pullUpStayDistance} = this.props
        let {refreshing} = viewState
        if(this._refreshState != refreshing) {
            pullUpStayDistance = 0
        }
        let headerHeight
        if(!this._beginResetScrollTopTimeStamp) {
            headerHeight = this._moveMent
            this._beginResetScrollTopTimeStamp = timestamp
        }
        else {
            let percent = (timestamp - this._beginResetScrollTopTimeStamp) / scrollBounceAnimationDuration
            headerHeight = this._moveMent - (this._moveMent - pullUpStayDistance) * easeOutCirc(percent, scrollBounceAnimationDuration * percent, 0, 1, scrollBounceAnimationDuration)
        }

        if(headerHeight < pullUpStayDistance) {
            headerHeight = pullUpStayDistance
        }

        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })

        if(timestamp - this._beginResetScrollTopTimeStamp > scrollBounceAnimationDuration) {
            this._beginResetScrollTopTimeStamp = null
            this._moveMent = 0
            return
        }

        this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetRefreshScrollTop)
    }

    _resetLoadMoreScrollTop = (timestamp) => {
        let {pullDownStayDistance} = this.props
        let {loading_more} = viewState
        if(this._loadMoreState != loading_more) {
            pullDownStayDistance = 0
        }
        let footerHeight, scrollViewTranslateY
        if(!this._beginResetScrollTopTimeStamp) {
            footerHeight = Math.abs(this._moveMent)
            scrollViewTranslateY = 0
            this._beginResetScrollTopTimeStamp = timestamp
            this._fixedScrollY = this._scrollY
        }
        else {
            let scrollViewTranslateMaxY
            let percent = (timestamp - this._beginResetScrollTopTimeStamp) / scrollBounceAnimationDuration
            footerHeight = Math.abs(this._moveMent) - (Math.abs(this._moveMent) - pullDownStayDistance) * easeOutCirc(percent, scrollBounceAnimationDuration * percent, 0, 1, scrollBounceAnimationDuration)
            scrollViewTranslateMaxY = this._fixedScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)
            scrollViewTranslateY = scrollViewTranslateMaxY * (timestamp - this._beginResetScrollTopTimeStamp) / refreshAnimationDuration
            if (scrollViewTranslateY > scrollViewTranslateMaxY) {
                scrollViewTranslateY = scrollViewTranslateMaxY
            }
        }

        if(footerHeight < pullDownStayDistance) {
            footerHeight = pullDownStayDistance
        }

        this._footer.setNativeProps({
            style: {
                height: footerHeight,
            }
        })
        this._scrollView.scrollTo({ y: this._fixedScrollY - scrollViewTranslateY, animated: false, })

        if(timestamp - this._beginResetScrollTopTimeStamp > scrollBounceAnimationDuration) {
            this._beginResetScrollTopTimeStamp = null
            this._moveMent = 0
            return
        }

        this._refreshBackAnimationFrame = this.requestAnimationFrame(this._resetLoadMoreScrollTop)
    }

    _resetHeaderLayout = (timestamp) => {
        let {loaded_all, load_more_none} = viewState
        let {pullUpStayDistance} = this.props
        let headerHeight
        if (!this._beginTimeStamp) {
            headerHeight = pullUpStayDistance
            this._beginTimeStamp = timestamp
            this._fixedScrollY = this._scrollY > 0 ? this._scrollY : 0
        }
        else {
            headerHeight = pullUpStayDistance - (pullUpStayDistance - this._fixedScrollY) * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
            if (headerHeight < 0) {
                headerHeight = 0
            }
        }
        this._header.setNativeProps({
            style: {
                height: headerHeight,
            }
        })

        if (timestamp - this._beginTimeStamp > refreshAnimationDuration) {
            this._header.setNativeProps({
                style: {
                    height: 0,
                }
            })
            if (this._fixedScrollY > 0) {
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

            //enabled swipe event
            this._swipeRefreshLayout.setNativeProps({
                refreshing: false,
            })
            this._scrollView.setNativeProps({
                scrollEnabled: true,
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
            this._fixedScrollY = this._scrollY
        }
        else {
            let scrollViewTranslateMaxY
            footerHeight = pullDownStayDistance - pullDownStayDistance * (timestamp - this._beginTimeStamp) / refreshAnimationDuration

            if (this._touching && (this._fixedScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)) > pullDownStayDistance) {
                scrollViewTranslateMaxY = pullDownStayDistance
            }
            else {
                scrollViewTranslateMaxY = this._fixedScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)
            }
            scrollViewTranslateY = scrollViewTranslateMaxY * (timestamp - this._beginTimeStamp) / refreshAnimationDuration
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

        this._scrollView.scrollTo({ y: this._fixedScrollY - scrollViewTranslateY, animated: false, })

        if (timestamp - this._beginTimeStamp > refreshAnimationDuration) {
            this._beginTimeStamp = null
            this._loadMoreBackAnimating = false
            this._afterLoadMoreBacked = true

            this._setPaddingBlank()

            //enabled swipe event
            this._swipeRefreshLayout.setNativeProps({
                refreshing: false,
            })
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
                         style={[styles.footer, this.props.autoLoadMore ? null : styles.shrink,]}
                         viewType={refreshViewType.footer}
                         renderRefreshContent={this.props.renderFooter}/>
        )
    }

}

export default TimerEnhance(PullToRefreshListView)