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
    NativeModules,
} from 'react-native'

const styles = StyleSheet.create({
    header: {
        height: 0,
        justifyContent: 'flex-end',
        //alignItems: 'center',
        backgroundColor: 'green',
    },
    footer: {
        height: 0,
        justifyContent: 'flex-start',
        //alignItems: 'center',
        backgroundColor: 'green',
    },
})

export default class PullToRefreshListView extends Component {

    static defaultProps = {
        viewType: 'scroll',
    }

    static PropTypes = {
        viewType: PropTypes.oneOf([
            'scroll',
            'list',
        ]),
        ...ListView.propTypes,
    }

    constructor (props) {
        super(props)
        this.state = {}

        ////console.log.log('NativeModules.UIManager')
        ////console.log.log(NativeModules.UIManager)
    }

    render () {
        return (
            this.props.viewType == 'scroll' ?
                <ScrollView
                    ref={ component => this._scrollView = component }
                    scrollEventThrottle={16}
                    {...this.props}
                    onLayout={this._onLayout}
                    onContentSizeChange={this._onContentSizeChange}
                    onResponderGrant={this._onResponderGrant}
                    onScroll={this._onScroll}
                    onResponderRelease={this._onResponderRelease}
                    >
                    {this._renderHeader()}
                    {this.props.children}
                    {this._renderFooter()}
                </ScrollView> :
                <ListView/>
        )
    }

    componentWillUnmount () {
        clearTimeout( this._refreshTimer )
        clearTimeout( this._loadMoreTimer )
    }

    _onLayout = (e) => {
        if(this._scrollViewContainerHeight == null) {
            this._scrollViewContainerHeight = e.nativeEvent.layout.height
            ////console.log.log('this._scrollViewContainerHeight = ' + this._scrollViewContainerHeight)
        }
    }

    _onContentSizeChange = (contentWidth, contentHeight) => {
        if(this._scrollViewContentHeight == null) {
            this._scrollViewContentHeight = contentHeight
            ////console.log.log('this._scrollViewContentHeight = ' + this._scrollViewContentHeight)
        }
    }

    _onResponderGrant = (e) => {
        //console.log.log('_onResponderGrant...' )
        ////console.log.log(e.nativeEvent)
        //if(e.nativeEvent.contentOffset) {
        //    this._scrollView._innerViewRef.setNativeProps({
        //        style: {
        //            transform: [{translateY: 0},],
        //        }
        //    })
        //    ////console.log.log('last scrollY = ' + this._scrollY)
        //    //this._scrollView.scrollTo({ y : this._scrollY - 30,  animated: false, })
        //    //setImmediate( () => {
        //    //    this._afterLoadMoreBacking = false
        //    //})
        //
        //}

        if(this._refreshBackFrame) {
            //console.log.log(this._refreshBackFrame)
            cancelAnimationFrame(this._refreshBackFrame)
            this._beginResetScrollTopTimeStamp = null
            //console.log.log('cancelAnimationFrame(this._refreshBackFrame)')
        }

        this._touching = true

        if (e.nativeEvent.contentOffset) {
            if(this._afterLoadMoreBacking) {
                ////console.log.log('e.nativeEvent.contentOffset && this._afterLoadMoreBacking')
                this._afterLoadMoreBacking = false
            }
            if(this._afterRefreshBacking) {
                this._scrollY = e.nativeEvent.contentOffset.y
                ////console.log.log('e.nativeEvent.contentOffset && this._afterRefreshBacking')
                //this._scrollView._innerViewRef.setNativeProps({
                //    style: {
                //        transform: [{translateY: 0,},],
                //    }
                //})
                //this._scrollView.scrollTo({y: this._scrollY - 15, animated: false,})

                this._afterRefreshBacking = false
            }
        }
    }


    _onScroll = (e) => {
        //////console.log.log('e.nativeEvent.contentOffset')
        //////console.log.log(e.nativeEvent.contentOffset)
        //////console.log.log('e.nativeEvent.contentInset')
        if(!this.lastD) this.lastD = Date.now()
        ////console.log.log(Date.now() - this.lastD)
        this.lastD = Date.now()
        //////console.log.log(e.nativeEvent.contentInset)

        //console.log.log( '_onScroll scrollY = ' +  e.nativeEvent.contentOffset.y )
        //if(this._scrollY - 30) {
        //
        //}

        this._scrollY = e.nativeEvent.contentOffset.y

        if(this._scrollY == 0 || this._scrollY == 967) {
            //console.log.log('scrollBack = ' + (Date.now() - this._tempStartDate))
        }

        //if(this._loadMoreBacking || this._refreshBacking) {
        //    return
        //}
        //
        //if(!this._afterRefreshBacking && this._scrollY <= 0 ) {
        //    //////console.log.log('!this._afterRefreshBacking && this._scrollY <= 0')
        //
        //    //if( !this._willRefreshing && this._scrollY < -100 ) {
        //    //    ////console.log.log('!this._willRefreshing && this._scrollY < -100')
        //    //    this._willRefreshing = true
        //    //
        //    //        this._header.setNativeProps({
        //    //            style: {
        //    //                height: 30,
        //    //            }
        //    //        })
        //    //        this._scrollView._innerViewRef.setNativeProps({
        //    //            style: {
        //    //                transform: [{translateY: -30}],
        //    //                //marginTop: -30,
        //    //            }
        //    //        })
        //    //
        //    //
        //    //}
        //    //else if(this._willRefreshing && this._scrollY > -100) {
        //    //    ////console.log.log('this._willRefreshing = false')
        //    //    this._willRefreshing = false
        //    //}
        //    //if( this._refreshing && this._scrollY > -100 ) {
        //    //    ////console.log.log('this._refreshing && this._scrollY > -100')
        //    //    //this._header.setNativeProps({
        //    //    //    style: {
        //    //    //        height: 30,
        //    //    //    }
        //    //    //})
        //    //
        //    //    this._scrollView._innerViewRef.setNativeProps({
        //    //        style: {
        //    //            transform: [{translateY: 0}],
        //    //            //marginTop: 0,
        //    //
        //    //        }
        //    //    })
        //    //}
        //
        //    //0   120  sy
        //    //0   30   ty
        //    //if( this._willRefreshing && this._scrollY > -100 ) {
        //    //    ////console.log.log('this._willRefreshing && this._scrollY > -100')
        //    //    this._willRefreshing = false
        //    //    this._header.setNativeProps({
        //    //        style: {
        //    //            height: 30,
        //    //        }
        //    //    })
        //    //    this._scrollView._innerViewRef.setNativeProps({
        //    //        style: {
        //    //            transform: [{translateY: 0}],
        //    //        }
        //    //    })
        //    //}
        //
        //    //let height = this._refreshing ? 30 : Math.min(30, Math.abs(this._scrollY))
        //    //let height = this._refreshing ? Math.min(30, Math.abs(this._scrollY)) : Math.min(30, Math.abs(this._scrollY))
        //    //let translateY = this._refreshing ? 0 : -Math.min(30, Math.abs(this._scrollY))
        //    //let translateY = this._refreshing ? -(this._refreshStartScrollY - (this._refreshStartScrollY - this._scrollY)) / (this._refreshStartScrollY / 30) : -Math.min(30, Math.abs(this._scrollY))
        //
        //    //let height = this._refreshing ? 30 : Math.min(30, Math.abs(this._scrollY))
        //    //let translateY = this._refreshing ? 0 : -Math.min(30, Math.abs(this._scrollY))
        //    //
        //    //////console.log.log('height = ' + height)
        //    //
        //    //this._header.setNativeProps({
        //    //    style: {
        //    //        height: height,
        //    //    }
        //    //})
        //
        //}
        //else if(!this._afterLoadMoreBacking && this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight) {
        //    //////console.log.log('this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight')
        //    //////console.log.log('extra scrollY = ' + (this._scrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)))
        //
        //    //let height = this._loadingMore ? 30 : Math.min(30, Math.abs(this._scrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)))
        //    //let translateY = this._loadingMore ? 0 : -Math.min(30, Math.abs(this._scrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)))
        //    //
        //    //////console.log.log('height = ' + height + ' | translateY = ' + translateY)
        //
        //    //this._scrollView._innerViewRef.setNativeProps({
        //    //    style: {
        //    //        transform: [{translateY: translateY}],
        //    //        //marginTop: translateY
        //    //    }
        //    //})
        //    //this._footer.setNativeProps({
        //    //    style: {
        //    //        height: height,
        //    //        transform: [{translateY: -translateY}],
        //    //    }
        //    //})
        //}
        ////else {
        ////    ////console.log.log(`'this._refreshing = '${this._refreshing}' | this._loadingMore ='${this._loadingMore}`)
        ////    if( !this._refreshing && !this._refreshBacking && !this._loadingMore && !this._loadMoreBacking) {
        ////        ////console.log.log('this._refreshing && !this._loadingMore')
        ////        this._scrollView._innerViewRef.setNativeProps({
        ////            style: {
        ////                transform: [{translateY: 0}],
        ////                //marginTop: 0
        ////            }
        ////        })
        ////        this._header.setNativeProps({
        ////            style: {
        ////                height: 0,
        ////            }
        ////        })
        ////        this._footer.setNativeProps({
        ////            style: {
        ////                height: 0,
        ////            }
        ////        })
        ////    }
        ////
        ////}
        //
        ////if(this._pullState && e.nativeEvent.contentOffset.y > -30) {
        ////    this._scrollView._innerViewRef.setNativeProps({
        ////        style: {
        ////            transform: [{translateY: 30 + e.nativeEvent.contentOffset.y,}],
        ////        },
        ////    })
        ////}
        //
        ////if(this._pullState && e.nativeEvent.contentOffset.y < 100) {
        ////    this._scrollView._innerViewRef.setNativeProps({
        ////        style: {
        ////            transform: [{translateY: 30 + e.nativeEvent.contentOffset.y,}],
        ////        },
        ////    })
        ////}
        //
        ////if(e.nativeEvent.contentOffset.y < 100) {
        ////    this._scrollView._innerViewRef.setNativeProps({
        ////        style: {
        ////            transform: [{translateY: 30,}],
        ////        },
        ////    })
        ////}


    }

    _onResponderRelease = (e) => {
        //this._scrollView._innerViewRef.setNativeProps({
        //    style: {
        //        transform: [{translateY: 30,}],
        //    },
        //})
        this._tempStartDate = Date.now()

        //console.log.log('_onResponderRelease')

        //this._scrollView.scrollTo({y: this._scrollY, animated: false,})

        this._touching = false

        if(!this._refreshing && !this._refreshBacking && !this._afterRefreshBacking) {
            //console.log.log('this._refreshing -> this._scrollY = ' + this._scrollY)
            //this._refreshStartScrollY = this._scrollY
            if( this._scrollY < -100 ) {

                this._refreshFixScrollY = this._scrollY + 30
                this._header.setNativeProps({
                    style: {
                        height: 30,
                    }
                })
                //console.log.log('this._scrollView.scrollTo({y: this._refreshFixScrollY, animated: false,}) -> ' + this._refreshFixScrollY)
                this._scrollView.scrollTo({y: this._refreshFixScrollY, animated: false,})
                //this._scrollView.scrollTo({y: 0, animated: true,})

                this._refreshBackFrame = requestAnimationFrame(this._resetRefreshScrollTop)
                //console.log.log('set this._refreshBackFrame = ' + this._refreshBackFrame)
                //this._scrollView._innerViewRef.setNativeProps({
                //    style: {
                //        transform: [{translateY: 0}],
                //    }
                //})

                this._refreshing = true
                ////this._needBounceBack = true
                this._onPullToRefresh()
                ////this._scrollView.setNativeProps({
                ////    scrollEnabled: false,
                ////})
                //this._scrollView.scrollTo({y: -30, animated: true,})
                //////console.log.log('begin _refreshing!')

                //this._header.setNativeProps({
                //    style: {
                //        position: 'relative',
                //        top: 0,
                //    }
                //})

            }
        }
        if(!this._loadingMore && !this._loadMoreBacking && !this._afterLoadMoreBacking) {
            ////console.log.log('!this._loadingMore && !this._afterLoadMoreBacking')
            if( this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight +100 ) {
                ////console.log.log('this._scrollY > this._scrollViewContentHeight - this._scrollViewContainerHeight + 100')

                this._footer.setNativeProps({
                    style: {
                        height: 30,
                    }
                })

                this._loadingMore = true
                //this._needBounceBack = true
                this._onPullToLoadMore()
                ////this._scrollView.setNativeProps({
                ////    scrollEnabled: false,
                ////})
                //this._scrollView.scrollTo({y: -30, animated: true,})
                //////console.log.log('begin _refreshing!')

                //this._header.setNativeProps({
                //    style: {
                //        position: 'relative',
                //        top: 0,
                //    }
                //})

            }
        }


        //if(this._loadMoreBacking) {
        //    this._stopLoadMoreScrollTo = true
        //}


        //if( this._scrollY < -100 ) {
        //    this._scrollView.scrollTo({y: -30, animated: true,})
        //    if(!this._refreshing) {
        //        this._refreshing = true
        //        //this._pullState =
        //
        //        this._needBounceBack = true
        //        this._onPullToRefresh()
        //    }
        //    else {
        //        this._needBounceBack = false
        //    }
        //}


    }

    _onPullToRefresh() {

        this._refreshTimer = setTimeout( () => {

            this._refreshing = false
            //this._scrollView.scrollTo({y: 0, animated: true,})
            //this._scrollView.setNativeProps({
            //    scrollEnabled: true,
            //})

            this._refreshBacking = true

            ////console.log.log(`${this._scrollY}`)
            if(this._scrollY < 30) {
                requestAnimationFrame(this._resetHeaderLayout)
            }
            else {
                this._header.setNativeProps({
                    style: {
                        height: 0,
                    }
                })
                this._scrollView.scrollTo({y: this._scrollY - 30, animated: false,})
                this._beginTimeStamp = null

                //this._willRefreshing = false

                this._refreshBacking = false
                this._afterRefreshBacking = true
            }

            //this._header.setNativeProps({
            //    style: {
            //        height: 5,
            //    }
            //})

            ////console.log.log('end _refreshing!')

        }, 5000)

    }

    _onPullToLoadMore() {
        this._loadMoreTimer = setTimeout( () => {

            this._loadingMore = false
            //this._scrollView.scrollTo({y: 0, animated: true,})
            //this._scrollView.setNativeProps({
            //    scrollEnabled: true,
            //})

            this._loadMoreBacking = true
            //this._scrollView.setNativeProps({
            //    scrollEnabled: false,
            //})


            ////console.log.log(`${this._scrollY}' | '${this._scrollViewContentHeight - this._scrollViewContainerHeight}`)
            if(this._scrollY >= this._scrollViewContentHeight - this._scrollViewContainerHeight) {
                requestAnimationFrame(this._resetFooterLayout)
            }
            else {
                this._footer.setNativeProps({
                    style: {
                        height: 0,
                    }
                })
                this._scrollView.scrollTo({y: this._scrollY, animated: false,}) //not necessary?

                this._beginTimeStamp = null
                this._loadMoreBacking = false
                this._afterLoadMoreBacking = true

                //this._stopLoadMoreScrollTo = false
            }


            //this._scrollView.scrollTo({ y: this._scrollViewContentHeight - this._scrollViewContainerHeight - 30})
            //this._footer.setNativeProps({
            //    style: {
            //        height: 0,
            //    }
            //})

            ////console.log.log('end _loadMore!' + (this._scrollViewContentHeight - this._scrollViewContainerHeight - 30))

        }, 5000)
    }

    _easeOutCirc (x, t, b, c, d) {
        return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
        //return c*((t=t/d-1)*t*t + 1) + b;
    }

    _resetRefreshScrollTop = (timestamp) => {

        //(1 - t)^2 P0 + 2 t (1 - t) P1 + t^2 P2


        if(!this._beginResetScrollTopTimeStamp) {
            this._beginResetScrollTopTimeStamp = timestamp
            this._scrollView.scrollTo({y: this._refreshFixScrollY, animated: false,})
        }
        else {
            let percent = (timestamp - this._beginResetScrollTopTimeStamp) / 510
            //this._resetScrollTop = -this._refreshFixScrollY - -this._refreshFixScrollY * (timestamp - this._beginResetScrollTopTimeStamp) / 510
            this._resetScrollTop = -this._refreshFixScrollY - -this._refreshFixScrollY * this._easeOutCirc(percent, 510 * percent, 0, 1, 510)
            if(this._resetScrollTop < 0) {
                this._resetScrollTop = 0
            }
            //this._scrollView.scrollTo({y: this._refreshFixScrollY, animated: false,})
            //console.log.log('this._scrollView.scrollTo({y: -this._resetScrollTop, animated: false,}) ->' + (-this._resetScrollTop))
            this._scrollView.scrollTo({y: -this._resetScrollTop, animated: false,})
            if(timestamp - this._beginResetScrollTopTimeStamp > 510) {
                this._beginResetScrollTopTimeStamp = null
                return
            }
        }
        this._refreshBackFrame = requestAnimationFrame(this._resetRefreshScrollTop)
    }

    _resetHeaderLayout = (timestamp) => {
        let maxHeight = 30
        if(!this._beginTimeStamp) {
            this._headerHeight = maxHeight
            //this._scrollViewTranslateY = 0
            this._beginTimeStamp = timestamp
            this._lastScrollY = this._scrollY > 0 ? this._scrollY : 0
        }
        else {
            this._headerHeight = maxHeight - (maxHeight - this._lastScrollY) * (timestamp - this._beginTimeStamp) / 255
            //this._headerHeight = maxHeight - maxHeight * (timestamp - this._beginTimeStamp) / 255
            //this._scrollViewTranslateY = this._lastScrollY - this._lastScrollY * (timestamp - this._beginTimeStamp) / 255
            if(this._headerHeight < 0) {
                this._headerHeight = 0
            }
            //if(this._scrollViewTranslateY < 0) {
            //    this._scrollViewTranslateY = 0
            //}
        }

        ////console.log.log('(timestamp - this._beginTimeStamp) / 255 = ' + (timestamp - this._beginTimeStamp) / 255)

        this._header.setNativeProps({
            style: {
                height: this._headerHeight,
            }
        })

        ////console.log.log('xxx this._headerHeight = ' + this._headerHeight)
        //////console.log.log('_scrollViewTranslateY = ' + this._scrollViewTranslateY)
        //this._scrollView.scrollTo({y: this._scrollViewTranslateY, animated: false,})

        if(timestamp - this._beginTimeStamp > 255) {
            this._header.setNativeProps({
                style: {
                    height: 0,
                }
            })
            if(this._lastScrollY > 0) {
                this._scrollView.scrollTo({y: 0, animated: false,})
            }
            this._beginTimeStamp = null

            //this._willRefreshing = false

            this._refreshBacking = false
            this._afterRefreshBacking = true
            return
        }

        requestAnimationFrame(this._resetHeaderLayout)
    }

    _resetFooterLayout = (timestamp) => {
        let maxHeight = 30
        if(!this._beginTimeStamp) {
            this._footerHeight = maxHeight
            this._scrollViewTranslateY = 0
            this._beginTimeStamp = timestamp
            this._lastScrollY = this._scrollY
            ////console.log.log('this._lastScrollY = ' + this._lastScrollY)
        }
        else {
            this._footerHeight = maxHeight - maxHeight * (timestamp - this._beginTimeStamp) / 255
            //this._scrollViewTranslateY = maxHeight * (timestamp - this._beginTimeStamp) / 255

            ////console.log.log('(this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)) = ' + (this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)))
            //this._scrollViewTranslateY = this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)
            if(this._touching && (this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)) > 30) {
                this._scrollViewTranslateMaxY = 30
            }
            else {
                this._scrollViewTranslateMaxY = this._lastScrollY - (this._scrollViewContentHeight - this._scrollViewContainerHeight)
            }
            this._scrollViewTranslateY = this._scrollViewTranslateMaxY * (timestamp - this._beginTimeStamp) / 255
            if(this._footerHeight < 0) {
                this._footerHeight = 0
            }
            if(this._scrollViewTranslateY > this._scrollViewTranslateMaxY) {
                this._scrollViewTranslateY = this._scrollViewTranslateMaxY
            }
        }

        //////console.log.log('(timestamp - this._beginTimeStamp) / 1000 = ' + (timestamp - this._beginTimeStamp) / 255)


        ////console.log.log('this._footerHeight = ' + this._footerHeight)
        ////console.log.log('this._scrollViewTranslateY = ' + this._scrollViewTranslateY)

        this._footer.setNativeProps({
            style: {
                height: this._footerHeight,
            }
        })
        //this._scrollView._innerViewRef.setNativeProps({
        //    style: {
        //        transform: [{translateY: this._scrollViewTranslateY},],
        //    }
        //})
        //console.log.log('this._lastScrollY- this._scrollViewTranslateY = ' + (this._lastScrollY - this._scrollViewTranslateY))
        //if(!this._stopLoadMoreScrollTo) {
            this._scrollView.scrollTo({y: this._lastScrollY - this._scrollViewTranslateY, animated: false,})
        //}
        //else {
        //    if(!this._endLoadMoreScrollTo) {
        //        this._endLoadMoreScrollTo = true
        //        this._scrollView.scrollTo({y: this._lastScrollY - this._scrollViewTranslateMaxY, animated: false,})
        //    }
        //}

        if(timestamp - this._beginTimeStamp > 255) {
            //let y = this._scrollY - 30
            //////console.log.log('y = ' + y)
            //this._scrollView.scrollTo({y: y, animated: false,})
            //this._scrollView.setNativeProps({
            //    scrollEnabled: true,
            //})
            this._beginTimeStamp = null
            this._loadMoreBacking = false
            this._afterLoadMoreBacking = true

            //this._stopLoadMoreScrollTo = false
            //this._endLoadMoreScrollTo = true

            return
        }

        requestAnimationFrame(this._resetFooterLayout)
    }

    _renderHeader () {
        return (
            <View ref={ component => this._header = component } style={[styles.header, ]}>
                {this._renderHeaderContent()}
            </View>
        )
    }

    _renderFooter () {
        return (
            <View ref={ component => this._footer = component } style={[styles.footer, ]}>
                {this._renderFooterContent()}
            </View>
        )
    }

    _renderHeaderContent() {
        return (
            <View style={{height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                {this._renderActivityIndicator()}
            </View>
        )
    }

    _renderFooterContent() {
        return (
            <View style={{height: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                {this._renderActivityIndicator()}
            </View>
        )
    }

    _renderActivityIndicator() {
        return ActivityIndicator ? (
            <ActivityIndicator
                style={{margin: 10,}}
                animating={true}
                color={'#ff0000'}
                size={'small'}/>
        ) : Platform.OS == 'android' ?
            (
                <ProgressBarAndroid
                    style={{margin: 10,}}
                    color={'#ff0000'}
                    styleAttr={'Small'}/>

            ) :  (
            <ActivityIndicatorIOS
                style={{margin: 10,}}
                animating={true}
                color={'#ff0000'}
                size={'small'}/>
        )


    }

}