package com.systemsimulator.model;

import lombok.Getter;
import lombok.Setter;

import java.util.HashMap;
import java.util.Map;

@Setter
@Getter
public class Link {
    private String id;
    private Component source;
    private Component target;
    private LinkType type;
    private HeuristicProfile heuristics = new HeuristicProfile();
    private Map<String, Object> properties = new HashMap<>();
    // Explicit IDs for stable serialization
    private String sourceId; // mirrors source.getId()
    private String targetId; // mirrors target.getId()

    public Link() {}

    public Link(String id, Component source, Component target, LinkType type) {
        this.id = id;
        this.source = source;
        this.target = target;
        this.type = type;
        if (source != null) this.sourceId = source.getId();
        if (target != null) this.targetId = target.getId();
    }

    public void setSource(Component source) {
        this.source = source;
        this.sourceId = source != null ? source.getId() : null;
    }

    public void setTarget(Component target) {
        this.target = target;
        this.targetId = target != null ? target.getId() : null;
    }

    public String getSourceId() {
        return sourceId != null ? sourceId : (source != null ? source.getId() : null);
    }

    public String getTargetId() {
        return targetId != null ? targetId : (target != null ? target.getId() : null);
    }
}
