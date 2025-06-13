const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { KMeans, parseCSV } = require('./script.js');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

async function generateClusterChart(data, labels, centroids, k, header) {
  const width = 800;
  const height = 600;
  const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
 
  const colors = [
    'rgba(255, 99, 132, 0.5)',   // Red
    'rgba(54, 162, 235, 0.5)',   // Blue
    'rgba(255, 206, 86, 0.5)',   // Yellow
    'rgba(75, 192, 192, 0.5)',   // Green
    'rgba(153, 102, 255, 0.5)',  // Purple
    'rgba(255, 159, 64, 0.5)',   // Orange
    'rgba(199, 199, 199, 0.5)',  // Gray
    'rgba(83, 102, 255, 0.5)',   // Indigo
    'rgba(255, 99, 255, 0.5)',   // Pink
    'rgba(0, 128, 128, 0.5)'     // Teal
  ];
  
  const xIndex = 0;
  const yIndex = 1;
  
  const datasets = [];
  
  for (let i = 0; i < k; i++) {
    const clusterData = data.filter((_, idx) => labels[idx] === i);
    if (clusterData.length > 0) {
      datasets.push({
        label: `Cluster ${i + 1}`,
        data: clusterData.map(point => ({
          x: point[xIndex],
          y: point[yIndex]
        })),
        backgroundColor: colors[i % colors.length],
        pointRadius: 5
      });
    }
  }
  
  datasets.push({
    label: 'Centroids',
    data: centroids.map(point => ({
      x: point[xIndex],
      y: point[yIndex]
    })),
    backgroundColor: 'rgba(0, 0, 0, 1)',
    pointStyle: 'triangle',
    pointRadius: 10,
    borderColor: 'rgba(0, 0, 0, 1)',
    borderWidth: 2
  });
  
  
const xLabel = header?.[0] || 'Dimension 1';
const yLabel = header?.[1] || 'Dimension 2';

const config = {
  type: 'scatter',
  data: { datasets },
  options: {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'K-means Clustering Results',
        font: { size: 18 }
      },
      legend: { position: 'top' }
    },
    scales: {
      x: { 
        title: { 
          display: true, 
          text: xLabel 
        }
      },
      y: { 
        title: { 
          display: true, 
          text: yLabel 
        }
      }
    }
  }
};
  
  const image = await chartJSNodeCanvas.renderToBuffer(config);
  
  const filename = `kmeans_chart_${Date.now()}.png`;
  const filePath = path.join(__dirname, 'public', filename);
  
  fs.writeFileSync(filePath, image);
  
  return filename;
}

app.post('/api/kmeans', upload.single('csvFile'), async (req, res) => {
  try {
    const k = parseInt(req.body.k) || 3;
    const maxIters = parseInt(req.body.maxIters) || 100;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }
    
    const csvData = fs.readFileSync(req.file.path, 'utf8');
    
    const { data, header } = parseCSV(csvData);
    
    
    const kmeans = new KMeans(k, maxIters, true);
    const labels = kmeans.predict(data);
    
    const chartFilename = await generateClusterChart(data, labels, kmeans.centroids, k, header);
    
    fs.unlinkSync(req.file.path);
    
    res.json({
      labels,
      centroids: kmeans.centroids,
      chartUrl: `./public/${chartFilename}`
    });
    
  } catch (error) {
    console.error('Error processing K-means request:', error);
    res.status(500).json({ 
      error: 'Failed to process K-means clustering',
      message: error.message 
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
