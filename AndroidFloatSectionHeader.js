import React, {
    PropTypes,
    Component,
} from 'react'
import {
    View,
} from 'react-native'

export default class AndroidFloatSectionHeader extends Component {

    static propTypes = {
        ...View.propTypes,
        floatSectionHeaderWidth: PropTypes.number.isRequired,
        renderChildren: PropTypes.func.isRequired,
    }

    constructor (props) {
        super(props)
        this.state = {
            sectionID: '',
            hidden: true,
        }
    }

    render () {
        return (
            <View
                {...this.props}
                style={{position: 'absolute', top: 0, left: 0, width: this.props.floatSectionHeaderWidth,
                        opacity: !this.state.hidden ? 1 : 0, }}>
                {this.props.renderChildren(this.state.sectionID)}
            </View>
        )
    }

    setSectionID = (sectionID) => {
        this.setState({
            sectionID,
        })
    }

}