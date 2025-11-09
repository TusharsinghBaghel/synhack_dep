package com.systemsimulator.model;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Setter
@Getter
public abstract class Component {
    private String id;
    private String name;
    private HeuristicProfile heuristics = new HeuristicProfile();
    private Map<String, Object> properties = new HashMap<>();

    // Canvas position for UI reconstruction
    private CanvasPosition position;

    public Component() {}

    public Component(String id, String name) {
        this.id = id;
        this.name = name;
    }

    // Each concrete class must define its component type
    public abstract ComponentType getType();

    @Getter
    @Setter
    public static class CanvasPosition {
        private double x;
        private double y;

        public CanvasPosition() {}

        public CanvasPosition(double x, double y) {
            this.x = x;
            this.y = y;
        }
    }
}
