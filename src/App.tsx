import { Suspense, Component, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Experience } from './components/Experience';
import { Interface } from './components/Interface';
import { Overlay } from './components/Overlay';
import { LoadingScreen } from './components/LoadingScreen';
import { useStore } from './store/useStore';
import * as THREE from 'three';

// Simple Error Boundary for the 3D Scene
class SceneErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: any) { console.error("3D Scene Error:", error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Oops! The forest is lost.</h2>
          <p>We couldn't load the 3D models. Please refresh the page!</p>
          <button onClick={() => window.location.reload()}>TRY AGAIN</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const isStarted = useStore((state) => state.isStarted);
  const quality = useStore((state) => state.quality);

  return (
    <SceneErrorBoundary>
      <div className="game-container">
        <LoadingScreen />

        <Canvas
          shadows
          dpr={quality === 'high' ? [1, 2] : [1, 1]}
          gl={{
            antialias: false,
            toneMapping: THREE.ACESFilmicToneMapping
          }}
          camera={{ position: [0, 5, 12], fov: 45 }}
        >
          <Suspense fallback={null}>
            <Experience />
          </Suspense>
        </Canvas>

        {isStarted && (
          <>
            <Interface />
            <Overlay />
          </>
        )}
      </div>

      <style>{`
        .error-fallback {
          position: absolute;
          inset: 0;
          background: #111;
          color: white;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          z-index: 1000;
        }
        .error-fallback button {
          background: #4ade80;
          color: #064e3b;
          border: none;
          padding: 1rem 2rem;
          border-radius: 1rem;
          font-weight: 800;
          cursor: pointer;
          margin-top: 1rem;
        }
      `}</style>
    </SceneErrorBoundary>
  );
}

export default App;
