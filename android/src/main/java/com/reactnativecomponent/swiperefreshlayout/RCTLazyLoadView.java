package com.reactnativecomponent.swiperefreshlayout;

import android.content.Context;
import android.graphics.Point;
import android.graphics.Rect;
import android.util.Log;
import android.view.View;
import android.view.ViewGroup;


public class RCTLazyLoadView extends ViewGroup {

    private OnEvChangeListener onEvChangeListener;


    public RCTLazyLoadView(Context context) {
        super(context);
    }

    @Override
    protected void onLayout(boolean changed, int l, int t, int r, int b) {

    }

//    @Override
//    protected void dispatchVisibilityChanged(View changedView, int visibility) {
//        super.dispatchVisibilityChanged(changedView, visibility);
//        Log.i("1Test", "dispatchVisibilityChanged");
//    }
//
//    @Override
//    public void dispatchWindowVisibilityChanged(int visibility) {
//        super.dispatchWindowVisibilityChanged(visibility);
//        Log.i("1Test", "dispatchWindowVisibilityChanged");
//    }


//    @Override
//    protected void onVisibilityChanged(View changedView, int visibility) {
//        super.onVisibilityChanged(changedView, visibility);
//        Log.i("1Test", "onVisibilityChanged");
//    }
//
//    @Override
//    public boolean getChildVisibleRect(View child, Rect r, Point offset) {
//        Log.i("1Test", "getChildVisibleRect");
//        return super.getChildVisibleRect(child, r, offset);
//    }

    @Override
    protected void onWindowVisibilityChanged(int visibility) {
//        Log.i("1Test", "onWindowVisibilityChanged");
        super.onWindowVisibilityChanged(visibility);
        Boolean hiddenState = false;
        if (visibility == View.VISIBLE) {
//            Log.i("1Test", "View可见=========true");
            hiddenState = false;
        } else if (visibility == View.INVISIBLE || visibility == View.GONE) {
//            Log.i("1Test", "View隐藏=========false");
            hiddenState = true;
        }
        onEvChangeListener.onWindowVisibilityChange(hiddenState);
    }

    public void setOnEvChangeListener(OnEvChangeListener onEvChangeListener) {
//        Log.i("1Test", "setOnEvChangeListener");
        this.onEvChangeListener = onEvChangeListener;
    }

//    protected boolean isCover() {
//        boolean cover = false;
//        Rect rect = new Rect();
//        cover = getGlobalVisibleRect(rect);
////        Log.i("1Test","可见区域："+rect.width()+", 高度："+rect.height());
//
//        return true;
//    }
}
