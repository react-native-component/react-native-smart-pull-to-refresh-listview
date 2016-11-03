
import React, {
    PropTypes,
    Component,
} from 'react'
import {
    View,
} from 'react-native'

export default class ListItem extends Component {


    static propTypes = {
        ...View.propTypes,
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
