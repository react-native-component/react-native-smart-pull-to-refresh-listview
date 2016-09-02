
const constants = {
    viewType: {
        scrollView: 0,
        listView: 1,
    },
    viewState: {
        refresh_none: 0,
        refresh_idle: 1,
        will_refresh: 2,
        refreshing: 3,
        load_more_none: 4,
        load_more_idle: 5,
        will_load_more: 6,
        loading_more: 7,
        loaded_all: 8,
    },
    refreshViewType: {
        header: 0,
        footer: 1,
    },
    refreshAnimationDuration: 255,
    scrollBounceAnimationDuration: 510,
}

export default constants