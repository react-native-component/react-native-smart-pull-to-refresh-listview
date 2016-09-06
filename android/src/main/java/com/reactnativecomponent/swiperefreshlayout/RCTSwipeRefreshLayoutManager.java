package com.reactnativecomponent.swiperefreshlayout;

import android.support.annotation.Nullable;

import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.util.Map;


public class RCTSwipeRefreshLayoutManager extends ViewGroupManager<RCTSwipeRefreshLayout> {

    @Override
    public String getName() {
        return "RCTSwipeRefreshLayout";
    }


    @ReactProp(name = "refreshing", defaultBoolean = false)
    public void setRefresh(RCTSwipeRefreshLayout view, @Nullable boolean enabled) {
        view.setRefreshing(enabled);
    }

    @ReactProp(name = "enabledPullUp", defaultBoolean = true)
    public void setEnabledPullUp(RCTSwipeRefreshLayout view, @Nullable boolean enabled) {
        view.setEnabledPullUp(enabled);
    }

    @ReactProp(name = "enabledPullDown", defaultBoolean = true)
    public void setEnalbedPullDown(RCTSwipeRefreshLayout view, @Nullable boolean enabled) {
        view.setEnalbedPullDown(enabled);
    }

    @Override
    protected RCTSwipeRefreshLayout createViewInstance(ThemedReactContext reactContext) {
        return new RCTSwipeRefreshLayout(reactContext);
    }


    @Override
    protected void addEventEmitters(
            final ThemedReactContext reactContext,
            final RCTSwipeRefreshLayout view) {
        view.setOnEvTouchListener(
                new RCTSwipeRefreshLayout.OnEvTouchListener() {
                    @Override
                    public void onSwipe(int movement) {
                        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                                .dispatchEvent(new TouchEvent(view.getId(), SystemClock.nanoTime(), movement));
                    }

                    @Override
                    public void onSwipeRefresh() {
                        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                                .dispatchEvent(new TouchUpEvent(view.getId(), SystemClock.nanoTime()));
                    }

                });
    }


    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("RCTSwipeRefreshLayout.TouchMove", MapBuilder.of("registrationName", "onSwipe"))
                .put("RCTSwipeRefreshLayout.TouchUp", MapBuilder.of("registrationName", "onSwipeRefresh"))
                .build();
    }


}
