import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  FaDatabase,
  FaMemory,
  FaNetworkWired,
  FaStream,
  FaHdd,
  FaBalanceScale,
  FaBolt,
  FaLayerGroup,
  FaGlobe,
  FaLaptop,
} from 'react-icons/fa';
import './ComponentNode.css';

const ICON_MAP = {
  DATABASE: FaDatabase,
  CACHE: FaMemory,
  API_SERVICE: FaNetworkWired,
  QUEUE: FaStream,
  STORAGE: FaHdd,
  LOAD_BALANCER: FaBalanceScale,
  STREAM_PROCESSOR: FaBolt,
  BATCH_PROCESSOR: FaLayerGroup,
  EXTERNAL_SERVICE: FaGlobe,
  CLIENT: FaLaptop,
};

const ComponentNode = ({ id, data }) => {
  const isPreview = String(id || '').startsWith('preview-');
  const type = (data?.componentType || '').toUpperCase();
  const SubIcon = ICON_MAP[type] || FaGlobe;
  
  // Get the display name (label) and subtype separately
  const displayName = data?.label || '';
  const subtype = data?.subtype || data?.properties?.subtype || '';
  
  // Format the name properly (remove underscores, capitalize properly)
  const formattedName = String(displayName)
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Format the subtype properly
  const formattedSubtype = String(subtype)
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  
  // Format the component type (Database, Cache, etc.)
  const formattedType = String(type)
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return (
    <div
      className={`component-node-icon ${isPreview ? 'preview' : 'real'}`}
      title={`${formattedType}${formattedSubtype ? ` (${formattedSubtype})` : ''}${formattedName ? ` - ${formattedName}` : ''}`}
      data-node-id={id}
    >
      {/* top target handle (visible & connectable) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={true}
        className="node-handle node-handle-top"
        style={{ background: 'transparent' }}
        aria-label="top-connection"
      />

      <div className="sketchy-icon-wrap">
        <SubIcon className={`node-icon`} />
      </div>

      <div className="component-node-text">
        <div className="component-type-text">
          {formattedType}
          {formattedSubtype && (
            <span className="component-subtype-inline"> ({formattedSubtype})</span>
          )}
        </div>
        {formattedName && (
          <div className="component-name-text">
            {formattedName}
          </div>
        )}
      </div>

      {/* bottom source handle (visible & connectable) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={true}
        className="node-handle node-handle-bottom"
        style={{ background: 'transparent' }}
        aria-label="bottom-connection"
      />
    </div>
  );
};

export default ComponentNode;
