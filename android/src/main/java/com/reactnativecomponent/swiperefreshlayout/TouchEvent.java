package com.reactnativecomponent.swiperefreshlayout;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.Event;
import com.facebook.react.uimanager.events.RCTEventEmitter;

public class TouchEvent extends Event<TouchEvent> {
    private int movement;

    public TouchEvent(int viewTag, long timestampMs, int movement) {
        super(viewTag);
        this.movement = movement;
    }

    @Override
    public String getEventName() {
        return "RCTSwipeRefreshLayout.TouchMove";
    }

    @Override
    public void dispatch(RCTEventEmitter rctEventEmitter) {
        rctEventEmitter.receiveEvent(getViewTag(), getEventName(), serializeEventData());
    }

    private WritableMap serializeEventData() {
        WritableMap eventData = Arguments.createMap();
        eventData.putInt("movement", getMovement());
        return eventData;
    }

    private int getMovement() {
        return movement;
    }


}
