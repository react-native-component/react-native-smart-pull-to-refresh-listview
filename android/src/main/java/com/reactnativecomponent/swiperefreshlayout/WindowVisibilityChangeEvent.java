package com.reactnativecomponent.swiperefreshlayout;

import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class WindowVisibilityChangeEvent extends Event<WindowVisibilityChangeEvent> {
        boolean hiddenState;

    public WindowVisibilityChangeEvent(int viewTag, long timestampMs, boolean hiddenState) {
//        super(viewTag, timestampMs);
        super(viewTag);
        this.hiddenState = hiddenState;
    }

    @Override
    public String getEventName(){
        return "RCTLayzyLoadView.onWindowVisibilityChange";
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putBoolean("hidden",getHiddenState());
//        Log.i("Test","hidden="+getHiddenState());

        return eventData;
    }

    public boolean getHiddenState() {
        return hiddenState;
    }


}
