/*
 * A smart pull-down-refresh and pull-up-loadmore react-native listview
 * https://github.com/react-native-component/react-native-smart-pull-to-refresh-listview/
 * Released under the MIT license
 * Copyright (c) 2016 react-native-component <moonsunfall@aliyun.com>
 */


import {
    Platform,
} from 'react-native'

import AndroidPullToRefreshListView from './PullToRefreshListView-android'
import IOSPullToRefreshListView from './PullToRefreshListView-ios'

let PullToRefreshListView

if(Platform.OS == 'ios') {
    PullToRefreshListView = IOSPullToRefreshListView
}
else {
    PullToRefreshListView = AndroidPullToRefreshListView
}

export default PullToRefreshListView
