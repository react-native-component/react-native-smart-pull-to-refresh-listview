
import React, {
    Component,
} from 'react'
import PropTypes from 'prop-types';
import {
    View,
    ViewPropTypes,
} from 'react-native'

export default class ListItem extends Component {


    static propTypes = {
        ...ViewPropTypes,
    }

    constructor(props) {
        super(props)
        this.state = {
            hidden: true,
        }
    }

    render() {
        //console.log(`this.state.hidden = ${this.state.hidden}`)
        return (
            <View {...this.props}>
                {!this.state.hidden ? this.props.children : null}
            </View>
        )
    }

    show() {
        this.setState({
            hidden: false,
        })
    }

    hide() {
        this.setState({
            hidden: true,
        })
    }
}
