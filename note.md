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

* 貌似0.34版本开始ScrollView/ListView在滚动没有结束前, 除了onScroll事件外的其他代码无法执行, 直到滚动(包括动能)完全结束再执行(这将会影响原有代码逻辑)
* 要注意ListView的onEndReached事件为native事件, 使用该原生事件代替在js中手动计算是否拉到底可以完全避免有时连续触发二次上拉加载更多数据逻辑
       onEndReachedThreshold设置为0时可能会存在偏差导致onEndReached事件不触发, 改设为StyleSheet.hairlineWidth
* 为节省内存, 为配合react-native-smart-image-loader图片懒加载的使用,
       内嵌新增ListItem, 该组件内部放置listview的行内容,
       当某项ListItem显示在屏幕范围外时, 将行内容置空, 用以最大限度的释放内存,
       当某项ListItem显示在屏幕范围内时, 重新加载行内容
       由于中低端Android普遍渲染速度跟不上, ListItem的整行内容未渲染出来时导致视图上有空白区域, 故增加了允许只指定行内部的子元素(比如Image)进行操作, 其他子元素内容保持不释放
* android实现ios效果的sticky-header, 通过计算显示在可视区域内的顺序第一个section-header的位置,
  以及显示在可视区域内的顺序第一个的row的位置, 来判断当前的sticky-header应设置为哪一个section-header的内容


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
  [bool]enabledPullUp
  [bool]enabledPullDown
* api:
  [func]beginRefresh
  [func]endRefresh
  [func]endLoadMore
