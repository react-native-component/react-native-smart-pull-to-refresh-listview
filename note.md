* 要注意ios由于ScrollView自带bounce空间, 可以不借助native实现
* 要注意android由于ScrollView没有bounce空间, 需要借助自定义native的SwipeRefreshLayout来辅助实现,
  判断scrollView是否拉到顶和底, 然后触发SwipeRefreshLayout的touchmove和touchup事件来控制scrollView的header和footer
* 要注意, 最后一项高度增大/缩小并不会导致当前屏幕视觉上产生偏移
* 要注意, 最后一项高度增大不会导致当前滚动距离产生变化, 但会增加最大滚动距离
* 要注意, 最后一项高度缩小会导致当前滚动距离产生变化, 需要手动修正滚动距离
* 要注意, 第一项高度增大/缩小会导致当前屏幕视频上产生偏移
* 要注意, 第一项高度增大/缩小不会导致当前滚动距离产生变化
* 要注意, 下拉刷新和上拉加载不能同时触发
* 要注意, 如滚动内容高度小于滚动容器高度, 需要补足空白区域
* 要注意, 下拉刷新时, 如上拉加载更多的状态为loaded_all, 需要将其重置为load_more_none
* 要注意, 使用ListView的下拉加载更多功能时, 需要设定pageSize的值每次新增的数据行数量一致, 否则渲染会一行行渲染并导致有可能跳帧
* 要注意, 当使用上拉加载成功加载新数据(比如第二页的数据)后, 再使用下拉刷新时, 由于只加载第一页的数据, 需要在重新获取内容高度后, 额外重置滚动条距离(为只有第一页数据时拉到底的值)
* 要注意, 判断拉到顶时, 仅需验证滚动条距离是否为0,
         判断拉到底时, 需要验证滚动条距离是否等于滚动内容高度减去滚动容器高度, 由于可能存在浮点数, 这里允许有一定误差范围, 范围为正负当前设备的1个像素点px对应1个点的pt值

* refresh-status:
  0. refresh_none
  1. refresh_idle
  2. will_refresh
  3. refreshing
  4. load_more_none
  5. load_more_idle
  6. will_load_more
  7. loading_more
  8. loaded_all
* pull-down-refresh flow
  refresh_none -> refresh_idle -> will_refresh -> refreshing -> refresh_none
* pull-up-load-more flow
  load_more_none -> load_more_idle -> will_load_more -> loading_more -> load_more_none
* pull-up-load-more loaded_all flow
  load_more_none -> load_more_idle -> will_load_more -> loading_more -> loaded_all
* pull-up-auto-load-more flow
  load_more_none -> loading_more -> load_more_none
* pull-up-auto-load-more loaded_all flow
  load_more_none -> loading_more -> loaded_all
* prop:
  [enum]viewType
  [bool]autoLoadMore
  [func]onRefresh
  [func]onLoadMore
  [func]renderHeader
  [func]renderFooter
  [number]pullUpDistance
  [number]pullUpStayDistance
  [number]pullDownDistance
  [number]pullDownStayDistance
  [bool]disabledPullUp
  [bool]disabledPullDown
* api:
  [func]beginRefresh
  [func]endRefresh
  [func]endLoadMore
