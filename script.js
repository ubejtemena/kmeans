// funkcia na výpočet Euklidovskej vzdialenosti
function euclideanDistance(x1, x2) {
  return Math.sqrt(
    x1.reduce((sum, val, i) => sum + Math.pow(val - x2[i], 2), 0)
  );
}

class KMeans {
  constructor(K = 5, maxIters = 100, plotSteps = false) {
    this.K = K;
    this.maxIters = maxIters;
    this.plotSteps = plotSteps;
    this.clusters = Array(this.K).fill().map(() => []);
    this.centroids = [];
  }
//////////////////////////////////////////////////////////////


  predict(X) {
    this.X = X;
    this.nSamples = X.length;
    this.nFeatures = X[0].length;
    
    const randomSampleIdxs = this._getRandomIndices(this.nSamples, this.K);
    this.centroids = randomSampleIdxs.map(idx => this.X[idx]);
    
    // Optimalizácia klastrov
    for (let i = 0; i < this.maxIters; i++) {
      // Vytvorenie klastrov
      this.clusters = this._createClusters(this.centroids);
     
      // Vypocet nových centroidov
      const centroidsOld = JSON.parse(JSON.stringify(this.centroids));
      this.centroids = this._getCentroids(this.clusters);
      
      if (this._isConverged(centroidsOld, this.centroids)) {
        break;
      }
    }
    
    return this._getClusterLabels(this.clusters);
  }


/////////////////////////////////////////////////////////////

  _getRandomIndices(max, count) { // Nahodne centroidy
    const indices = new Set();
    while (indices.size < count) {
      indices.add(Math.floor(Math.random() * max));
    }
    return Array.from(indices);
  }




  _closestCentroid(sample, centroids) { // Najblizsi centroid

    // Vzdialenosť od kazdeho centroidu
    const distances = centroids.map(point => euclideanDistance(sample, point));
    
    let minIdx = 0;
    let minDist = distances[0];
    
    for (let i = 1; i < distances.length; i++) {
      if (distances[i] < minDist) {
        minDist = distances[i];
        minIdx = i;
      }
    }
    
    return minIdx;
  }



  _createClusters(centroids) { // Priradi data k najblizsiemu centroidu
    const clusters = Array(this.K).fill().map(() => []);
    
    this.X.forEach((sample, idx) => {
      const centroidIdx = this._closestCentroid(sample, centroids);
      clusters[centroidIdx].push(idx);
    });
    
    return clusters;
  }

  
  
  
  _getCentroids(clusters) { // Nove centroidy

    // Priradenie avg klastrov centroidom
    const centroids = Array(this.K).fill().map(() => Array(this.nFeatures).fill(0));
    
    clusters.forEach((cluster, clusterIdx) => {
      if (cluster.length === 0) return;
      
      const clusterMean = Array(this.nFeatures).fill(0);
      
      cluster.forEach(sampleIdx => {
        const sample = this.X[sampleIdx];
        sample.forEach((val, featureIdx) => {
          clusterMean[featureIdx] += val;
        });
      });
      
      clusterMean.forEach((sum, featureIdx) => {
        centroids[clusterIdx][featureIdx] = sum / cluster.length;
      });
    });
    
    return centroids;
  }
  




  _isConverged(centroidsOld, centroids) { // Stabilny stav?

    // Vzdialenosti medzi starými a novými centroidmi
    const distances = centroidsOld.map((oldCentroid, i) => 
      euclideanDistance(oldCentroid, centroids[i])
    );
    
    return distances.reduce((a, b) => a + b, 0) === 0;
  }





_getClusterLabels(clusters) {
    const labels = new Array(this.nSamples).fill(0);
    
    clusters.forEach((cluster, clusterIdx) => {
      cluster.forEach(sampleIdx => {
        labels[sampleIdx] = clusterIdx;
      });
    });
    
    return labels;
  }

}




function parseCSVAndEncodeCategorical(csvText) {
  const lines = csvText.trim().split('\n');
  const hasHeader = isNaN(parseFloat(lines[0].split(',')[0]));
  let header = null;
  let startIdx = 0;

  if (hasHeader) {
    header = lines[0].split(',').map(h => h.trim());
    startIdx = 1;
  }

  const rawRows = [];
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    rawRows.push(lines[i].split(',').map(val => val.trim()));
  }

  const columns = rawRows[0].map((_, colIndex) => rawRows.map(row => row[colIndex]));

  const encodedColumns = columns.map(col => {
    if (col.every(val => !isNaN(parseFloat(val)))) {
      return col.map(val => parseFloat(val));
    } else {
      const map = {};
      let currentCode = 0;
      return col.map(val => {
        if (!(val in map)) {
          map[val] = currentCode++;
        }
        return map[val];
      });
    }
  });

  const data = encodedColumns[0].map((_, rowIndex) =>
    encodedColumns.map(col => col[rowIndex])
  );

  return { data, header };
}

module.exports = {
  KMeans,
  parseCSV: parseCSVAndEncodeCategorical
}

