# react-native-smart-pull-to-refresh-listview

[![npm](https://img.shields.io/npm/v/react-native-smart-pull-to-refresh-listview.svg)](https://www.npmjs.com/package/react-native-smart-pull-to-refresh-listview)
[![npm](https://img.shields.io/npm/dm/react-native-smart-pull-to-refresh-listview.svg)](https://www.npmjs.com/package/react-native-smart-pull-to-refresh-listview)
[![npm](https://img.shields.io/npm/dt/react-native-smart-pull-to-refresh-listview.svg)](https://www.npmjs.com/package/react-native-smart-pull-to-refresh-listview)
[![npm](https://img.shields.io/npm/l/react-native-smart-pull-to-refresh-listview.svg)](https://github.com/react-native-component/react-native-smart-pull-to-refresh-listview/blob/master/LICENSE)

A smart pull-down-refresh and pull-up-loadmore react-native listview,
for ios, written in pure JS, for android, written in JS and Java.

This component is compatible with React Native 0.25 and newer.

## Preview

![react-native-pull-to-refresh-listview-preview-ios][1]
![react-native-pull-to-refresh-listview-preview-android][2]

## Advanced Features

* Flexible pull to refresh control for ios and android,

easy to customize the 'RefreshView' style and content,
bounce effect for both pull down refresh and pull up load more,
if you want, you can also use the 'autoLoad' mode for pull up load more.
[demonstration][101]

* Memory management for ios and android,

if you want, the listRow can remove its children to release memory when its position is outside viewport of device,
and will undo when its position is inside viewport of device.
[demonstration][102]

* Extended support sticky header for android

it also supports sticky header with pull to refresh
[demonstration][103]


## Installation

```
npm install react-native-smart-pull-to-refresh-listview --save
```

## Installation (Android)

* In `android/settings.gradle`

```
...
include ':react-native-smart-swipe-refresh-layout'
project(':react-native-smart-swipe-refresh-layout').projectDir = new File(rootProject.projectDir, '../node_modules/react-native-smart-pull-to-refresh-listview/android')
```

* In `android/app/build.gradle`

```
...
dependencies {
    ...
    // From node_modules
    compile project(':react-native-smart-swipe-refresh-layout')
}
```

* In MainActivity.java

```
...
import com.reactnativecomponent.swiperefreshlayout.RCTSwipeRefreshLayoutPackage;    //import package
...
/**
 * A list of packages used by the app. If the app uses additional views
 * or modules besides the default ones, add more packages here.
 */
@Override
protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new RCTSwipeRefreshLayoutPackage()  //register Module
    );
}
...

```

* If you're using react-native 0.30-, follow these extra steps

    * In node_modules/react-native-smart-pull-to-refresh-listview/android/src/main/java/com/reactnativecomponent/swiperefreshlayout/

        * In TouchEvent.java

            ```
            ...
            public TouchEvent(int viewTag, long timestampMs, int movement) {
                super(viewTag, timestampMs);    //for older version
                //super(viewTag);                 //for newer version
                this.movement = movement;
            }
            ...
            ```
        *  In TouchUpEvent.java

            ```
            ...
            public TouchUpEvent(int viewTag, long timestampMs) {
                super(viewTag, timestampMs);  //for older verion
                //super(viewTag);                 //for newer version
            }
            ...
            ```

## Full Demo

see [ReactNativeComponentDemos][0]

## Usage

```js
import React, {
    Component,
} from 'react'
import {
    View,
    Text,
    StyleSheet,
    Alert,
    ScrollView,
    ListView,
    Image,
    ActivityIndicator,
    ProgressBarAndroid,
    ActivityIndicatorIOS,
    Platform,
} from 'react-native'

import TimerEnhance from 'react-native-smart-timer-enhance'
import PullToRefreshListView from 'react-native-smart-pull-to-refresh-listview'

export default class PullToRefreshListViewDemo extends Component {

    // 构造
      constructor(props) {
        super(props);

        this._dataSource = new ListView.DataSource({
            rowHasChanged: (r1, r2) => r1 !== r2,
            //sectionHeaderHasChanged: (s1, s2) => s1 !== s2,
        });

      let dataList = []

        this.state = {
            first: true,
            dataList: dataList,
            dataSource: this._dataSource.cloneWithRows(dataList),
        }
    }

    componentDidMount () {
        this._pullToRefreshListView.beginRefresh()
    }

    //Using ListView
    render() {
        return (
            <PullToRefreshListView
                ref={ (component) => this._pullToRefreshListView = component }
                viewType={PullToRefreshListView.constants.viewType.listView}
                contentContainerStyle={{backgroundColor: 'yellow', }}
                style={{marginTop: Platform.OS == 'ios' ? 64 : 56, }}
                initialListSize={20}
                enableEmptySections={true}
                dataSource={this.state.dataSource}
                pageSize={20}
                renderRow={this._renderRow}
                renderHeader={this._renderHeader}
                renderFooter={this._renderFooter}
                //renderSeparator={(sectionID, rowID) => <View style={styles.separator} />}
                onRefresh={this._onRefresh}
                onLoadMore={this._onLoadMore}
                pullUpDistance={35}
                pullUpStayDistance={50}
                pullDownDistance={35}
                pullDownStayDistance={50}
            />
        )

    }

    _renderRow = (rowData, sectionID, rowID) => {
        return (
            <View style={styles.thumbnail}>
                <View style={styles.textContainer}>
                    <Text>{rowData.text}</Text>
                </View>
            </View>
        )
    }

    _renderHeader = (viewState) => {
        let {pullState, pullDistancePercent} = viewState
        let {refresh_none, refresh_idle, will_refresh, refreshing,} = PullToRefreshListView.constants.viewState
        pullDistancePercent = Math.round(pullDistancePercent * 100)
        switch(pullState) {
            case refresh_none:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>pull down to refresh</Text>
                    </View>
                )
            case refresh_idle:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>pull down to refresh{pullDistancePercent}%</Text>
                    </View>
                )
            case will_refresh:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>release to refresh{pullDistancePercent > 100 ? 100 : pullDistancePercent}%</Text>
                    </View>
                )
            case refreshing:
                return (
                    <View style={{flexDirection: 'row', height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        {this._renderActivityIndicator()}<Text>refreshing</Text>
                    </View>
                )
        }
    }

    _renderFooter = (viewState) => {
        let {pullState, pullDistancePercent} = viewState
        let {load_more_none, load_more_idle, will_load_more, loading_more, loaded_all, } = PullToRefreshListView.constants.viewState
        pullDistancePercent = Math.round(pullDistancePercent * 100)
        switch(pullState) {
            case load_more_none:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>pull up to load more</Text>
                    </View>
                )
            case load_more_idle:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>pull up to load more{pullDistancePercent}%</Text>
                    </View>
                )
            case will_load_more:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>release to load more{pullDistancePercent > 100 ? 100 : pullDistancePercent}%</Text>
                    </View>
                )
            case loading_more:
                return (
                    <View style={{flexDirection: 'row', height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        {this._renderActivityIndicator()}<Text>loading</Text>
                    </View>
                )
            case loaded_all:
                return (
                    <View style={{height: 35, justifyContent: 'center', alignItems: 'center', backgroundColor: 'pink',}}>
                        <Text>no more</Text>
                    </View>
                )
        }
    }

    _onRefresh = () => {
        //console.log('outside _onRefresh start...')

        //simulate request data
        this.setTimeout( () => {

            //console.log('outside _onRefresh end...')
            let addNum = 20
            let refreshedDataList = []
            for(let i = 0; i < addNum; i++) {
                refreshedDataList.push({
                    text: `item-${i}`
                })
            }

            this.setState({
                dataList: refreshedDataList,
                dataSource: this._dataSource.cloneWithRows(refreshedDataList),
            })
            this._pullToRefreshListView.endRefresh()

        }, 3000)
    }

    _onLoadMore = () => {
        //console.log('outside _onLoadMore start...')

        this.setTimeout( () => {

            //console.log('outside _onLoadMore end...')

            let length = this.state.dataList.length
            let addNum = 20
            let addedDataList = []
            if(length >= 100) {
                addNum = 3
            }
            for(let i = length; i < length + addNum; i++) {
                addedDataList.push({
                    text: `item-${i}`
                })
            }
            let newDataList = this.state.dataList.concat(addedDataList)
            this.setState({
                dataList: newDataList,
                dataSource: this._dataSource.cloneWithRows(newDataList),
            })

            let loadedAll
            if(length >= 100) {
                loadedAll = true
                this._pullToRefreshListView.endLoadMore(loadedAll)
            }
            else {
                loadedAll = false
                this._pullToRefreshListView.endLoadMore(loadedAll)
            }

        }, 3000)
    }

    _renderActivityIndicator() {
        return ActivityIndicator ? (
            <ActivityIndicator
                style={{marginRight: 10,}}
                animating={true}
                color={'#ff0000'}
                size={'small'}/>
        ) : Platform.OS == 'android' ?
            (
                <ProgressBarAndroid
                    style={{marginRight: 10,}}
                    color={'#ff0000'}
                    styleAttr={'Small'}/>

            ) :  (
            <ActivityIndicatorIOS
                style={{marginRight: 10,}}
                animating={true}
                color={'#ff0000'}
                size={'small'}/>
        )
    }

}



const styles = StyleSheet.create({
    itemHeader: {
        height: 35,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
        backgroundColor: 'blue',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    item: {
        height: 60,
        //borderBottomWidth: StyleSheet.hairlineWidth,
        //borderBottomColor: '#ccc',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },

    contentContainer: {
        paddingTop: 20 + 44,
    },

    thumbnail: {
        padding: 6,
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
        overflow: 'hidden',
    },

    textContainer: {
        padding: 20,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    }
})

export default TimerEnhance(PullToRefreshListViewDemo)
```

## Props

Prop                    | Type   | Optional | Default   | Description
----------------------- | ------ | -------- | --------- | -----------
...ListView.propTypes   |        |          |           | see [react-native documents][3]
viewType                | enum   | Yes      | Symbol    | determines the viewType which will be used(ScrollView, ListView)
autoLoadMore            | bool   | Yes      | false     | when the value is true, pull up load more will be auto
onRefresh               | func   | Yes      |           | when refreshing, this function will be called
onLoadMore              | func   | Yes      |           | when loadingMore, this function will be called
onEndReachedThreshold   | number | Yes      | 0         | threshold in pixels (virtual, not physical) for calling onLoadMore
pullUpDistance          | number | Yes      | 35        | determines the pull up max distance
pullUpStayDistance      | number | Yes      | 50        | determines the pull up stay distance
pullDownDistance        | number | Yes      | 35        | determines the pull down max distance
pullDownStayDistance    | number | Yes      | 50        | determines the pull down stay distance
enabledPullUp           | bool   | Yes      | true      | when the value is false, pull down refresh will be auto
enabledPullDown         | bool   | Yes      | true      | when the value is false, pull up load more will be auto
listItemProps           | object | Yes      |           | see [react-native documents][4]
renderRowWithVisibility | bool   | Yes      |           | when the value is true, the children of the listRow can be controlled with 'hidden' state
pageTop                 | number | Yes      | 0         | determines the top relative to the page of the float section header(sticky header) view
floatSectionHeaderWidth | number | Yes      |deviceWidth| determines the width of the float section header(sticky header) view
renderFloatSectionHeader| number | Yes      | 0         | determines the width of the float section header(sticky header) view
listSectionProps        | object | Yes      |           | see [react-native documents][4]

## Special Props

* listItemProps: when set this prop, listView will use special 'listRow',
the listRow will remove its children to release memory when its position is outside viewport of device,
and will undo when its position is inside viewport of device.
Usually it is used with 'react-native-smart-image-loader'

* renderRowWithVisibility: when the value is true,
the children of the listRow can be controlled with 'hidden' state.
This prop is valid when 'listItemProps' is being set, and it is only valid for android.
Usually it is used with 'react-native-smart-image-loader'

* pageTop, floatSectionHeaderWidth, renderFloatSectionHeader, listSectionProps
are used for android to support ios-like sticky header

## Method

* beginRefresh(bounceDisabled): force begin pull down refresh, if bounceDisabled is true, the bounce animation will be disabled
* endRefresh(bounceDisabled): end pull down refresh, if bounceDisabled is true, the bounce animation will be disabled
* endLoadMore: end pull up load more


[0]: https://github.com/cyqresig/ReactNativeComponentDemos
[1]: http://cyqresig.github.io/img/react-native-smart-pull-to-refresh-preview-v1.6.0.gif
[2]: http://cyqresig.github.io/img/react-native-smart-pull-to-refresh-preview-android-v1.6.0.gif
[3]: http://facebook.github.io/react-native/docs/listview.html#props
[4]: http://facebook.github.io/react-native/docs/view.html#props

[101]: http://cyqresig.github.io/img/pull-to-refresh-flexible-pull-to-refresh-control.gif
[102]: http://cyqresig.github.io/img/pull-to-refresh-memory-management.gif
[103]: http://cyqresig.github.io/img/pull-to-refresh-extended-support-sticky-header-for-android.gif