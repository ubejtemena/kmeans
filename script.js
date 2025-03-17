
class KMeans {
    constructor(K = 5, maxIters = 100) {
        this.K = K;
        this.maxIters = maxIters;
        this.clusters = Array.from({ length: K }, () => []);
        this.centroids = [];
    }

    //formula pre distanciu medzi dvoma dotkami
    static euclideanDistance(x1, x2) {
        return Math.sqrt(x1.reduce((sum, xi, i) => sum + (xi - x2[i]) ** 2, 0));
    }

    closestCentroid(sample, centroids) {
        const distances = centroids.map(centroid => KMeans.euclideanDistance(sample, centroid));
        return distances.indexOf(Math.min(...distances));
    }

    createClusters(centroids) {
        const clusters = Array.from({ length: this.K }, () => []);
        this.X.forEach((sample, idx) => {
            const closestIdx = this.closestCentroid(sample, centroids);
            clusters[closestIdx].push(idx);
        });
        return clusters;
    }

    getCentroids(clusters) {
        return clusters.map((cluster, clusterIdx) => {
            if (cluster.length === 0) return this.centroids[clusterIdx];
            
            return Array.from({ length: this.nFeatures }, (_, colIdx) => 
                cluster.reduce((sum, sampleIdx) => sum + this.X[sampleIdx][colIdx], 0) / cluster.length
            );
        });
    }

    isConverged(centroidsOld, centroidsNew) {
        return centroidsOld.every((oldCentroid, i) => 
            KMeans.euclideanDistance(oldCentroid, centroidsNew[i]) < 1e-6);  // Threshold for convergence
    }

    //hlavna funkcia
    predict(X) {
        this.X = X; //datas
        this.nSamples = X.length; //kolko je prvkov
        this.nFeatures = X[0].length; //kolko prvkov dat v jednom

        const randomIndices = new Set();   //Set() pre ne opakovanie
        while (randomIndices.size < this.K) {
            randomIndices.add(Math.floor(Math.random() * this.nSamples));
        }
        this.centroids = [...randomIndices].map(idx => X[idx]);

        for (let i = 0; i < this.maxIters; i++) { //pokial ne dosahne max pokus interaci
            this.clusters = this.createClusters(this.centroids); 
            const newCentroids = this.getCentroids(this.clusters);
            if (this.isConverged(this.centroids, newCentroids)) {
                break;
            }
            this.centroids = newCentroids; //pridat novy centr
        }

        return this.getClusterLabels(this.clusters); // dava label na clastery
    }

    getClusterLabels(clusters) {
        const labels = new Array(this.nSamples).fill(-1);
        clusters.forEach((cluster, clusterIdx) => {
            cluster.forEach(sampleIdx => {
                labels[sampleIdx] = clusterIdx;
            });
        });
        return labels;
    }
}

// Test
function generateTestData() {
    return [
        [1, 2], [2, 3], [3, 3], [5, 8], [8, 8], [9, 10],
        [10, 11], [11, 13], [1, 0], [0, 1]
    ];
}

// Example data (cars)
const cars = [
    [0,150, 1300, 500], // Car 1: 150 HP, 1300 kg
    [0,200, 1600, 300], // Car 2: 200 HP, 1600 kg
    [1,100, 1100, 400], // Car 3: 100 HP, 1100 kg
    [1,400, 2000, 700], // Car 4: 400 HP, 2000 kg (sports car)
    [2,450, 2200, 800], // Car 5: 450 HP, 2200 kg (sports car)
];

const kmeans = new KMeans(3, 100);
const labels = kmeans.predict(generateTestData());
console.log("labels:", labels);

//omoe
