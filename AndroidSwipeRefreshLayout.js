
import React, {
    Component,
} from 'react'
import PropTypes from 'prop-types';
import {
    View,
    requireNativeComponent,
    Platform,
    ViewPropTypes,
} from 'react-native'

export default class AndroidSwipeRefreshLayout extends Component {

    static propTypes = {
        ...ViewPropTypes,
        refreshing: PropTypes.bool,
        enabledPullUp: PropTypes.bool,
        enabledPullDown: PropTypes.bool,
        onSwipe: PropTypes.func,
        onRefresh: PropTypes.func,
    }

    setNativeProps(props) {
        this._nativeSwipeRefreshLayout.setNativeProps(props)
    }

    render() {

        return (
            <NativeSwipeRefreshLayout
                {...this.props}
                ref={ (component) => this._nativeSwipeRefreshLayout = component }
                onSwipe={this._onSwipe}
                onSwipeRefresh={this._onRefresh}
            />
        );
    }

    _onSwipe = (e) => {
        this.props.onSwipe(e.nativeEvent.movement)
    }

    _onRefresh = () => {
        this.props.onRefresh()
    }

}

const NativeSwipeRefreshLayout = Platform.OS == 'ios' ? View : requireNativeComponent('RCTSwipeRefreshLayout', AndroidSwipeRefreshLayout)
