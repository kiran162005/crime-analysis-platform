import DistrictChoroplethMap from './components/maps/DistrictChoroplethMap';
import sampleIncidentData from './components/maps/sampleIncidentData';

function App() {
  return (
    <div style={{ padding: 16 }}>
      <h1>Karnataka Crime Analytics</h1>
      <DistrictChoroplethMap
        incidentData={sampleIncidentData}
        onDistrictSelect={(d) => console.log('Selected:', d)}
        height="600px"
      />
    </div>
  );
}

export default App;