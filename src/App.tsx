import { ReactFlowProvider } from 'reactflow';
import { TopologyBuilder } from './components/TopologyBuilder';
import { WinBox } from './components/WinBox';
import { DesktopWinBox } from './components/DesktopWinBox';
import { useStore } from './store/useStore';

function App() {
  const currentScreen = useStore(state => state.currentScreen);

  return (
    <ReactFlowProvider>
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: currentScreen === 'topology' ? 1 : 0,
          pointerEvents: currentScreen === 'topology' ? 'auto' : 'none',
          transition: 'opacity 0.25s ease-in-out',
          zIndex: currentScreen === 'topology' ? 10 : 0
        }}
      >
        <TopologyBuilder />
        <WinBox />
      </div>

      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: currentScreen === 'desktop' ? 1 : 0,
          pointerEvents: currentScreen === 'desktop' ? 'auto' : 'none',
          transition: 'opacity 0.25s ease-in-out',
          zIndex: currentScreen === 'desktop' ? 10 : 0
        }}
      >
        {currentScreen === 'desktop' && <DesktopWinBox />}
      </div>

      <style>{`
        .neighbor-row:hover { background-color: #3399FF; color: white; }
      `}</style>
    </ReactFlowProvider>
  );
}

export default App;