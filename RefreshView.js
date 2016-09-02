import React, {
    Component,
    PropTypes,
} from 'react'
import {
    View,
} from 'react-native'

import constants from './constants'

export default class RefreshView extends Component {

    static defaultProps = {
        renderRefreshContent: () => null,
    }

    static propTypes = {
        ...View.propTypes,
        renderRefreshContent: PropTypes.func,
    }

    constructor (props) {
        super(props)
        this.state = {
            pullState: props.viewType == constants.refreshViewType.header ? constants.viewState.refresh_none : constants.viewState.load_more_none,
            pullDistancePercent: 0,
        }
    }

    setNativeProps (props) {
        this._refreshView.setNativeProps(props)
    }

    render () {
        return (
            <View ref={ component => this._refreshView = component } {...this.props}>
                {this.props.renderRefreshContent(this.state)}
            </View>
        )
    }

}