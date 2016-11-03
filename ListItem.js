
import {
    Platform,
} from 'react-native'

import AndroidListItem from './ListItem-android'
import IOSListItem from './ListItem-ios'

let ListItem

if(Platform.OS == 'ios') {
    ListItem = IOSListItem
}
else {
    ListItem = AndroidListItem
}

export default ListItem