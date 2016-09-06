
export const viewType = {
        scrollView: 0,
        listView: 1,
}
export const viewState = {
        refresh_none: 0,
        refresh_idle: 1,
        will_refresh: 2,
        refreshing: 3,
        refresh_freezing: 9,
        load_more_none: 4,
        load_more_idle: 5,
        will_load_more: 6,
        loading_more: 7,
        load_more_freezing: 10,
        loaded_all: 8,
}
export const refreshViewType = {
        header: 0,
        footer: 1,
}
export const refreshAnimationDuration = 255
export const scrollBounceAnimationDuration = 510

export default {
    viewType,
    viewState,
    refreshViewType,
    refreshAnimationDuration,
    scrollBounceAnimationDuration,
}