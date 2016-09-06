export const viewType = {
    scrollView: 0,
    listView: 1,
}
export const viewState = {
    refresh_none: 0,
    refresh_idle: 1,
    will_refresh: 2,
    refreshing: 3,
    refresh_freezing: 4,
    load_more_none: 5,
    load_more_idle: 6,
    will_load_more: 7,
    loading_more: 8,
    load_more_freezing: 9,
    loaded_all: 10,
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