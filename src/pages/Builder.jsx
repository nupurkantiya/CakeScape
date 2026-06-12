import React from 'react';
import BuilderCanvas from '../components/builder/BuilderCanvas';
import { useBuilder } from '../context/BuilderContext';
import '../styles/builder.css';

function Builder() {
  const { state, dispatch } = useBuilder();

  return (
    <div className="builder-page">
      {/* 3D Canvas Background */}
      <BuilderCanvas />

      {/* UI Overlay */}
      <div className="builder-ui-panel">
        <h1>CAKE BUILDER</h1>
        <p>Design your perfect dessert.</p>
        
        <div className="control-group">
          <h3>Number of Layers</h3>
          <div className="button-row">
            {[1, 2, 3].map(num => (
              <button 
                key={num} 
                className={state.layers === num ? 'active' : ''}
                onClick={() => dispatch({ type: 'SET_LAYERS', payload: num })}
              >
                {num} Layer{num > 1 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <h3>Flavor</h3>
          <div className="button-row">
            {['chocolate', 'vanilla', 'strawberry'].map(flavor => (
              <button 
                key={flavor} 
                className={state.flavor === flavor ? 'active' : ''}
                onClick={() => dispatch({ type: 'SET_FLAVOR', payload: flavor })}
              >
                {flavor.charAt(0).toUpperCase() + flavor.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="control-group">
          <h3>Frosting</h3>
          <div className="button-row">
            {['none', 'vanilla', 'chocolate', 'strawberry'].map(frosting => (
              <button 
                key={frosting} 
                className={state.frosting === frosting ? 'active' : ''}
                onClick={() => dispatch({ type: 'SET_FROSTING', payload: frosting })}
              >
                {frosting.charAt(0).toUpperCase() + frosting.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Builder;