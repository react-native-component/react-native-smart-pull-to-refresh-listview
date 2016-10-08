
import { StyleSheet, } from 'react-native'

export const withinErrorMargin = (left, right, threshold = 0) => {
    return Math.abs(left - right) < (StyleSheet.hairlineWidth + threshold)
}

export default {
    withinErrorMargin,
}