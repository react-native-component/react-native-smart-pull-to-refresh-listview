
import { StyleSheet, } from 'react-native'

export const withinErrorMargin = (left, right) => {
    return Math.abs(left - right) < StyleSheet.hairlineWidth
}

export default {
    withinErrorMargin,
}