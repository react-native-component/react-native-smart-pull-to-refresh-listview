package com.reactnativecomponent.swiperefreshlayout;


import com.facebook.react.common.MapBuilder;
import com.facebook.react.common.SystemClock;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.UIManagerModule;
import com.facebook.react.uimanager.ViewGroupManager;

import java.util.Map;

/**
 * Created by shiyunjie on 16/8/4.
 */
public class RCTLazyLoadViewManager extends ViewGroupManager<RCTLazyLoadView> {
    private static final String REACT_CLASS = "RCTLazyLoadView";//要与类名一致


    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public RCTLazyLoadView createViewInstance(final ThemedReactContext reactContext) {

        return new RCTLazyLoadView(reactContext);
    }



    @Override
    protected void addEventEmitters(
            final ThemedReactContext reactContext,
            final RCTLazyLoadView view) {
        view.setOnEvChangeListener(
                new OnEvChangeListener() {
                    @Override
                    public void onWindowVisibilityChange( boolean hiddenState) {
                        reactContext.getNativeModule(UIManagerModule.class).getEventDispatcher()
                                .dispatchEvent(new WindowVisibilityChangeEvent(view.getId(), SystemClock.nanoTime(), hiddenState));
                    }

                });
    }

    @Override
    public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
        return MapBuilder.<String, Object>builder()
                .put("RCTLayzyLoadView.onWindowVisibilityChange", MapBuilder.of("registrationName", "onWindowVisibilityChange"))//registrationName 后的名字,RN中方法也要是这个名字否则不执行
                .build();
    }



}