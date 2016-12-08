package com.reactnativecomponent.swiperefreshlayout;

import android.content.Context;
import android.content.res.TypedArray;
import android.support.v4.view.MotionEventCompat;
import android.support.v4.view.NestedScrollingChild;
import android.support.v4.view.NestedScrollingChildHelper;
import android.support.v4.view.NestedScrollingParent;
import android.support.v4.view.NestedScrollingParentHelper;
import android.support.v4.view.ViewCompat;
import android.support.v4.widget.SwipeRefreshLayout;
import android.util.AttributeSet;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.widget.AbsListView;
import android.widget.ScrollView;

import com.facebook.react.uimanager.events.NativeGestureUtil;


public class RCTSwipeRefreshLayout extends ViewGroup implements NestedScrollingParent,
        NestedScrollingChild {


    private static final String LOG_TAG = RCTSwipeRefreshLayout.class.getSimpleName();

    private static final int INVALID_POINTER = -1;
    private static final float DRAG_RATE = .5f;

    private View mTarget; // the target of the gesture
    private OnEvTouchListener mTouchListener;
    private boolean mRefreshing = false;
    private boolean enabledPullUp = true;
    private boolean enabledPullDown = true;
    private int mTouchSlop;
    private float mPrevTouchX;
    private boolean mIntercepted;


    // If nested scrolling is enabled, the total amount that needed to be
    // consumed by this as the nested scrolling parent is used in place of the
    // overscroll determined by MOVE events in the onTouch handler
    private float mTotalUnconsumed;
    private final NestedScrollingParentHelper mNestedScrollingParentHelper;
    private final NestedScrollingChildHelper mNestedScrollingChildHelper;
    private final int[] mParentScrollConsumed = new int[2];
    private final int[] mParentOffsetInWindow = new int[2];

    //    private float mInitialMotionY;
    private float mInitialDownY;
    private boolean mIsBeingDragged;//拖动中
    private int mActivePointerId = INVALID_POINTER;

    // Target is returning to its start offset because it was cancelled or a
    // refresh was triggered.
    private boolean mReturningToStart;
    private static final int[] LAYOUT_ATTRS = new int[]{
            android.R.attr.enabled
    };


    private float mLastMargin;
    private float mMoveMargin;


    private float density;

    private int moveDirection = 0;  //1表示下拉, -1表示上拉

//    int scrollViewMeasuredHeight;

    /**
     * Simple constructor to use when creating a SwipeRefreshLayout from code.
     *
     * @param context
     */
    public RCTSwipeRefreshLayout(Context context) {
        this(context, null);
        DisplayMetrics dm = new DisplayMetrics();
        density = context.getResources().getDisplayMetrics().density;

        ViewCompat.setChildrenDrawingOrderEnabled(this, true);
        // the absolute offset has to take into account that the circle starts at an offset
        final DisplayMetrics metrics = getResources().getDisplayMetrics();


        setNestedScrollingEnabled(true);
    }

    /**
     * Constructor that is called when inflating SwipeRefreshLayout from XML.
     *
     * @param context
     * @param attrs
     */
    public RCTSwipeRefreshLayout(Context context, AttributeSet attrs) {
        super(context, attrs);

        mTouchSlop = ViewConfiguration.get(context).getScaledTouchSlop();

        setWillNotDraw(false);


        final TypedArray a = context.obtainStyledAttributes(attrs, LAYOUT_ATTRS);
        setEnabled(a.getBoolean(0, true));
        a.recycle();

        density = context.getResources().getDisplayMetrics().density;

        ViewCompat.setChildrenDrawingOrderEnabled(this, true);

        mNestedScrollingParentHelper = new NestedScrollingParentHelper(this);

        mNestedScrollingChildHelper = new NestedScrollingChildHelper(this);
        setNestedScrollingEnabled(true);
    }


    public void setOnEvTouchListener(OnEvTouchListener mTouchListener) {
        this.mTouchListener = mTouchListener;
    }


    private void ensureTarget() {
        // Don't bother getting the parent height if the parent hasn't been laid
        // out yet.
        if (mTarget == null) {
            for (int i = 0; i < getChildCount(); i++) {
                View child = getChildAt(0);
                mTarget = child;
                break;
            }
        }
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
//        final ScrollView scrollView = (ScrollView) mTarget;
//        scrollViewMeasuredHeight = scrollView.getChildAt(0).getMeasuredHeight();
//        scrollViewMeasuredHeight = scrollView.getMeasuredHeight();
//        Log.i("Test", "onLayout scrollViewMeasuredHeight = " + scrollViewMeasuredHeight);
    }

    @Override
    public void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        super.onMeasure(widthMeasureSpec, heightMeasureSpec);
        if (mTarget == null) {
            ensureTarget();
        }
        if (mTarget == null) {
            return;
        }
        mTarget.measure(MeasureSpec.makeMeasureSpec(
                getMeasuredWidth() - getPaddingLeft() - getPaddingRight(),
                MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(
                        getMeasuredHeight() - getPaddingTop() - getPaddingBottom(), MeasureSpec.EXACTLY));
    }

    /**
     * @return Whether it is possible for the child view of this layout to
     * scroll up. Override this if the child view is a custom view.
     */
    public boolean canChildScrollUp(float f) {
        boolean flag = false;

        if (!mRefreshing) {
            if (mTarget instanceof ScrollView) {

                final ScrollView scrollView = (ScrollView) mTarget;
                int scrollY = scrollView.getScrollY();
                int height = scrollView.getHeight();
                int scrollViewMeasuredHeight = scrollView.getChildAt(0).getMeasuredHeight();

//                Log.i("Test", "canChildScrollUp scrollY = " + scrollY + "| height = " + height + " | scrollViewMeasuredHeight = " + scrollViewMeasuredHeight);

                if (enabledPullDown && scrollY == 0 && f > 0) {
                    //滑动到了顶端 view.getScrollY()="+scrollY);
                    //Log.i("Test", "canChildScrollUp:" + f);
                    flag = false;
                } else if (enabledPullUp && (scrollY + height) >= scrollViewMeasuredHeight && f < 0) {
                    //滑动到了底部 scrollY="+scrollY);
                    //Log.i("Test", "canChildScrollUp:" + f);
                    flag = false;
                } else {
                    flag = true;
                }
            }
        } else {
            flag = true;
        }
        return flag;
    }

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        ensureTarget();

        final int action = MotionEventCompat.getActionMasked(ev);

        if (mReturningToStart && action == MotionEvent.ACTION_DOWN) {
            mReturningToStart = false;
        }

        switch (action) {
            case MotionEvent.ACTION_DOWN:

                mActivePointerId = MotionEventCompat.getPointerId(ev, 0);

                //Log.i("Test", "ACTION_DOWN:"+mActivePointerId);

                mIsBeingDragged = false;
                final float initialDownY = getMotionEventY(ev, mActivePointerId);
                if (initialDownY == -1) {
                    return false;
                }
                mInitialDownY = initialDownY;

                //Log.i("Test", "ACTION_DOWN:"+initialDownY);
                break;

            case MotionEvent.ACTION_MOVE:

                if (mActivePointerId == INVALID_POINTER) {
//                    Log.e(LOG_TAG, "Got ACTION_MOVE event but don't have an active pointer id.");
                    return false;
                }

//                final float y = getMotionEventY(ev, mActivePointerId);
                final float y = ev.getY();
                if (y == -1) {
                    return false;
                }
                final float yDiff = (y - mInitialDownY) * DRAG_RATE;
                if (yDiff > mTouchSlop || yDiff < -mTouchSlop) {
//                    mInitialMotionY = mInitialDownY + mTouchSlop;
                    mIsBeingDragged = !canChildScrollUp(yDiff);

                    return mIsBeingDragged;
                }
                break;

          /*  case MotionEventCompat.ACTION_POINTER_UP:
                onSecondaryPointerUp(ev);
                break;*/

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                mIsBeingDragged = false;
                mActivePointerId = INVALID_POINTER;

                break;
        }

        return mIsBeingDragged;
    }

    /**
     * completely bypasses ViewGroup's "disallowIntercept" by overriding
     * and never calling super.onInterceptTouchEvent().
     * This means that horizontal scrolls will always be intercepted, even though they shouldn't, so
     * we have to check for that manually here.
     */
    private boolean shouldInterceptTouchEvent(MotionEvent ev) {
        switch (ev.getAction()) {
            case MotionEvent.ACTION_DOWN:
                mPrevTouchX = ev.getX();
                mIntercepted = false;
                break;

            case MotionEvent.ACTION_MOVE:
                final float eventX = ev.getX();
                final float xDiff = Math.abs(eventX - mPrevTouchX);

                if (mIntercepted || xDiff > mTouchSlop) {
                    mIntercepted = true;
                    return false;
                }
        }
        return true;
    }

    private float getMotionEventY(MotionEvent ev, int activePointerId) {
        final int index = MotionEventCompat.findPointerIndex(ev, activePointerId);
        if (index < 0) {
            return -1;
        }
        return MotionEventCompat.getY(ev, index);
    }

    /**
     * {@link SwipeRefreshLayout} overrides {@link ViewGroup#requestDisallowInterceptTouchEvent} and
     * swallows it. This means that any component underneath SwipeRefreshLayout will now interact
     * incorrectly with Views that are above SwipeRefreshLayout. We fix that by transmitting the call
     * to this View's parents.
     */
    @Override
    public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
        if (getParent() != null) {
            getParent().requestDisallowInterceptTouchEvent(disallowIntercept);
        }
    }

    // NestedScrollingParent

    @Override
    public boolean onStartNestedScroll(View child, View target, int nestedScrollAxes) {
        return isEnabled() && !mReturningToStart
                && (nestedScrollAxes & ViewCompat.SCROLL_AXIS_VERTICAL) != 0;
    }

    @Override
    public void onNestedScrollAccepted(View child, View target, int axes) {
        // Reset the counter of how much leftover scroll needs to be consumed.
        mNestedScrollingParentHelper.onNestedScrollAccepted(child, target, axes);
        // Dispatch up to the nested parent
        startNestedScroll(axes & ViewCompat.SCROLL_AXIS_VERTICAL);
        mTotalUnconsumed = 0;
    }

    @Override
    public void onNestedPreScroll(View target, int dx, int dy, int[] consumed) {
        // If we are in the middle of consuming, a scroll, then we want to move the spinner back up
        // before allowing the list to scroll
        if (dy > 0 && mTotalUnconsumed > 0) {
            if (dy > mTotalUnconsumed) {
                consumed[1] = dy - (int) mTotalUnconsumed;
                mTotalUnconsumed = 0;
            } else {
                mTotalUnconsumed -= dy;
                consumed[1] = dy;
            }

        }

        // Now let our nested parent consume the leftovers
        final int[] parentConsumed = mParentScrollConsumed;
        if (dispatchNestedPreScroll(dx - consumed[0], dy - consumed[1], parentConsumed, null)) {
            consumed[0] += parentConsumed[0];
            consumed[1] += parentConsumed[1];
        }
    }

    @Override
    public int getNestedScrollAxes() {
        return mNestedScrollingParentHelper.getNestedScrollAxes();
    }

    @Override
    public void onStopNestedScroll(View target) {
        mNestedScrollingParentHelper.onStopNestedScroll(target);
        // Finish the spinner for nested scrolling if we ever consumed any
        // unconsumed nested scroll
        if (mTotalUnconsumed > 0) {

            mTotalUnconsumed = 0;
        }
        // Dispatch up our nested parent
        stopNestedScroll();
    }

    @Override
    public void onNestedScroll(final View target, final int dxConsumed, final int dyConsumed,
                               final int dxUnconsumed, final int dyUnconsumed) {
        // Dispatch up to the nested parent first
        dispatchNestedScroll(dxConsumed, dyConsumed, dxUnconsumed, dyUnconsumed,
                mParentOffsetInWindow);

        // This is a bit of a hack. Nested scrolling works from the bottom up, and as we are
        // sometimes between two nested scrolling views, we need a way to be able to know when any
        // nested scrolling parent has stopped handling events. We do that by using the
        // 'offset in window 'functionality to see if we have been moved from the event.
        // This is a decent indication of whether we should take over the event stream or not.
        final int dy = dyUnconsumed + mParentOffsetInWindow[1];
        if (dy < 0) {
            mTotalUnconsumed += Math.abs(dy);

        }
    }

    // NestedScrollingChild

    @Override
    public void setNestedScrollingEnabled(boolean enabled) {
        mNestedScrollingChildHelper.setNestedScrollingEnabled(enabled);
    }

    @Override
    public boolean isNestedScrollingEnabled() {
        return mNestedScrollingChildHelper.isNestedScrollingEnabled();
    }

    @Override
    public boolean startNestedScroll(int axes) {
        return mNestedScrollingChildHelper.startNestedScroll(axes);
    }

    @Override
    public void stopNestedScroll() {
        mNestedScrollingChildHelper.stopNestedScroll();
    }

    @Override
    public boolean hasNestedScrollingParent() {
        return mNestedScrollingChildHelper.hasNestedScrollingParent();
    }

    @Override
    public boolean dispatchNestedScroll(int dxConsumed, int dyConsumed, int dxUnconsumed,
                                        int dyUnconsumed, int[] offsetInWindow) {
        return mNestedScrollingChildHelper.dispatchNestedScroll(dxConsumed, dyConsumed,
                dxUnconsumed, dyUnconsumed, offsetInWindow);
    }

    @Override
    public boolean dispatchNestedPreScroll(int dx, int dy, int[] consumed, int[] offsetInWindow) {
        return mNestedScrollingChildHelper.dispatchNestedPreScroll(dx, dy, consumed, offsetInWindow);
    }

    @Override
    public boolean onNestedPreFling(View target, float velocityX,
                                    float velocityY) {
        return dispatchNestedPreFling(velocityX, velocityY);
    }

    @Override
    public boolean onNestedFling(View target, float velocityX, float velocityY,
                                 boolean consumed) {
        return dispatchNestedFling(velocityX, velocityY, consumed);
    }

    @Override
    public boolean dispatchNestedFling(float velocityX, float velocityY, boolean consumed) {
        return mNestedScrollingChildHelper.dispatchNestedFling(velocityX, velocityY, consumed);
    }

    @Override
    public boolean dispatchNestedPreFling(float velocityX, float velocityY) {
        return mNestedScrollingChildHelper.dispatchNestedPreFling(velocityX, velocityY);
    }

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        final int action = MotionEventCompat.getActionMasked(ev);
        int pointerIndex = -1;

        if (mReturningToStart && action == MotionEvent.ACTION_DOWN) {
            mReturningToStart = false;
        }

//        if (!isEnabled() || mReturningToStart || canChildScrollUp() || mNestedScrollInProgress) {
//            // Fail fast if we're not in a state where a swipe is possible
//            return false;
//        }


        switch (action) {
            case MotionEvent.ACTION_DOWN:
//                mActivePointerId = MotionEventCompat.getPointerId(ev, 0);
//                mIsBeingDragged = false;
//                //Log.i("Test", "ACTION_DOWN:"+mActivePointerId);
                break;

//            case MotionEvent.ACTION_MOVE: {
//
//                //判断是否scrollview是否在顶部
//                //
//                if (mTarget != null) {
//                    pointerIndex = MotionEventCompat.findPointerIndex(ev, mActivePointerId);
//                    //Log.i("Test", "ACTION_MOVE:"+pointerIndex);
//                    if (pointerIndex < 0) {
////                        Log.e(LOG_TAG, "Got ACTION_MOVE event but have an invalid active pointer id.");
//                        return false;
//                    }
//                    if (pointerIndex != mActivePointerId) {
//
//                        return true;
//                    }
//
//                    final float y = MotionEventCompat.getY(ev, pointerIndex);
////                    final float y = ev.getY();
////                    //Log.i("Test", "ACTION_DOWN:" + mInitialDownY);
////                    //Log.i("Test", "ACTION_MOVE:" + y);
//                    final float overscrollTop = (y - mInitialDownY) * DRAG_RATE;
//
//                    if (mMoveMargin == 0) {
//                        mMoveMargin = overscrollTop;
//                    } else {
//                        mMoveMargin += overscrollTop - mLastMargin;
//                    }
//
//                    mLastMargin = overscrollTop;
//                    //Log.i("Test", "mLastMargin:" + mMoveMargin);
//                    if (mMoveMargin > 0) {
//
//                        float newOverscrollTop = mMoveMargin / density;
//
//                        mTouchListener.onSwipe((int) newOverscrollTop);
////                        mTargetMargin = newOverscrollTop;
////                        moveSpinner(newOverscrollTop);
//                    } else {
//
//                        //上拉
//                        float newOverscrollTop = mMoveMargin / density;
//                        mTouchListener.onSwipe((int) newOverscrollTop);
////                        mTargetMargin = mMoveMargin;
////                        moveSpinner(newOverscrollTop);
//                    }
//
//                }
//                break;
//            }
            case MotionEvent.ACTION_MOVE: {
                //判断是否scrollview是否在顶部
                //
                if (mTarget != null) {
                    pointerIndex = MotionEventCompat.findPointerIndex(ev, mActivePointerId);//获得相对起始点move的点坐标
                    if (pointerIndex < 0) {
//                        Log.e(LOG_TAG, "Got ACTION_MOVE event but have an invalid active pointer id.");
                        return false;
                    }
                    if (pointerIndex != mActivePointerId) {

                        return true;
                    }

                    final float y = MotionEventCompat.getY(ev, pointerIndex);
//                    final float y = ev.getY();
//                    //Log.i("Test", "ACTION_DOWN:" + mInitialDownY);
//                    //Log.i("Test", "ACTION_MOVE:" + y);
                    final float overscrollTop = (y - mInitialDownY) * DRAG_RATE;


                    if (mMoveMargin == 0) {
                        //之前没有赋值上一次移动距离
                        if (moveDirection == 0) {
                            mMoveMargin = overscrollTop;
                        }
                    } else if (mMoveMargin > 0) {
                        //开始下移了 控制负数
                        if (moveDirection == 0) {
                            moveDirection = 1;
                        }
                        mMoveMargin += overscrollTop - mLastMargin;

                        if (mLastMargin > 0 && mMoveMargin <= 0) {
                            mMoveMargin = 0;
                        }

                        if (moveDirection == -1) {
                            //出现问题
                            mMoveMargin = 0;
                        }

                    } else if (mMoveMargin < 0) {
                        //开始上移了 控制负数
                        if (moveDirection == 0) {
                            moveDirection = -1;
                        }
                        mMoveMargin += overscrollTop - mLastMargin;

                        if (mLastMargin < 0 && mMoveMargin > 0) {
                            mMoveMargin = 0;
                        }

                        if (moveDirection == 1) {
                            //出现问题
                            mMoveMargin = 0;
                        }

                    }

                    mLastMargin = overscrollTop;
                    //Log.i("Test", "mLastMargin:" + mMoveMargin);
                    if (moveDirection == 1) {
                        //下拉

                        float newOverscrollTop = mMoveMargin / density;
//                        Log.i("Test", "ACTION_MOVE下拉:" + newOverscrollTop);
                        mTouchListener.onSwipe((int) newOverscrollTop);
//                        mTargetMargin = newOverscrollTop;
//                        moveSpinner(newOverscrollTop);
                    } else if (moveDirection == -1) {

                        //上拉
                        float newOverscrollTop = mMoveMargin / density;
//                        Log.i("Test", "ACTION_MOVE上拉:" + newOverscrollTop);
                        mTouchListener.onSwipe((int) newOverscrollTop);
//                        mTargetMargin = mMoveMargin;
//                        moveSpinner(newOverscrollTop);
                    }

                }
                break;
            }
            case MotionEventCompat.ACTION_POINTER_DOWN: {//非第一个触摸点按下
                //Log.i("Test", "ACTION_POINTER_DOWN");
                pointerIndex = MotionEventCompat.getActionIndex(ev);
                if (pointerIndex < 0) {
//                    Log.e(LOG_TAG, "Got ACTION_POINTER_DOWN event but have an invalid action index.");
                    return false;
                }

                mActivePointerId = MotionEventCompat.getPointerId(ev, pointerIndex);
                //Log.i("Test", "ACTION_POINTER_DOWN:"+mActivePointerId);
                final float initialDownY = getMotionEventY(ev, mActivePointerId);
                if (initialDownY == -1) {
                    return false;
                }
                mInitialDownY = initialDownY;
                //Log.i("Test", "initialDownY:"+initialDownY);
                mMoveMargin += mLastMargin;
                break;
            }

            case MotionEventCompat.ACTION_POINTER_UP: //
                //Log.i("Test", "ACTION_POINTER_UP");
                mActivePointerId = MotionEventCompat.getPointerId(ev, 0);
//                onSecondaryPointerUp(ev);
                break;

            case MotionEvent.ACTION_UP: {

//                pointerIndex = MotionEventCompat.findPointerIndex(ev, mActivePointerId);
                //Log.i("Test", "ACTION_UP:"+pointerIndex);
//                if (pointerIndex < 0) {
                    //Log.i(LOG_TAG, "Got ACTION_UP event but don't have an active pointer id.");
//                    return false;
//                }
                moveDirection = 0;

                mLastMargin = 0;
                mMoveMargin = 0;

                mTouchListener.onSwipeRefresh();

                mIsBeingDragged = false;
                mActivePointerId = INVALID_POINTER;

                return false;
            }
            case MotionEvent.ACTION_CANCEL:
                //Log.i("Test", "ACTION_CANCEL");

                mIsBeingDragged = false;
                return false;
        }

        return true;
    }


    public void setRefreshing(boolean mRefreshing) {
        this.mRefreshing = mRefreshing;
    }

    public void setEnabledPullUp(boolean enabledPullUp) {
        this.enabledPullUp = enabledPullUp;
    }

    public void setEnalbedPullDown(boolean enalbedPullDown) {
        this.enabledPullDown = enalbedPullDown;
    }


    public interface OnEvTouchListener {
        public void onSwipe(int movement);
        public void onSwipeRefresh();
    }
}
