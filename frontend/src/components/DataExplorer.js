import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ChartComponent from './ChartComponent';
import DataExplorerLoader from './DataExplorerLoader';

const DataExplorer = () => {
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [visualizationData, setVisualizationData] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoader, setShowLoader] = useState(true);
  const [chartType, setChartType] = useState('bar');
  
  // New state for filtering
  const [metadata, setMetadata] = useState(null);
  const [selectedStates, setSelectedStates] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedCrimeTypes, setSelectedCrimeTypes] = useState([]);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAllStates, setShowAllStates] = useState(false);
  const [showYearSeparately, setShowYearSeparately] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    // Show the immersive loader for 6 seconds, then load data
    const loaderTimer = setTimeout(() => {
      setShowLoader(false);
      fetchDatasets();
    }, 6000);

    return () => clearTimeout(loaderTimer);
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      fetchMetadata(selectedDataset.collection);
    }
  }, [selectedDataset]);

  const fetchDatasets = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/datasets`);
      if (response.ok) {
        const data = await response.json();
        
        // Reorder datasets: Crimes → Power → AQI → Literacy (removed user_profiles, status_checks, datasets)
        const datasetOrder = ['crimes', 'power_consumption', 'aqi', 'literacy'];
        const orderedDatasets = datasetOrder.map(collection => 
          data.find(d => d.collection === collection)
        ).filter(Boolean);
        
        // Add any remaining datasets not in the predefined order, excluding the unwanted ones
        const excludedCollections = ['user_profiles', 'status_checks', 'datasets'];
        const remainingDatasets = data.filter(d => 
          !datasetOrder.includes(d.collection) && !excludedCollections.includes(d.collection)
        );
        const finalDatasets = [...orderedDatasets, ...remainingDatasets];
        
        setDatasets(finalDatasets);
        if (finalDatasets.length > 0) {
          setSelectedDataset(finalDatasets[0]);
          await fetchVisualizationData(finalDatasets[0].collection);
        }
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetadata = async (collection) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/metadata/${collection}`);
      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
        // Reset filters when changing datasets
        setSelectedStates([]);
        setSelectedYears([]);
        setSelectedCrimeTypes([]);
        setSortBy('');
      }
    } catch (error) {
      console.error('Error fetching metadata:', error);
    }
  };

  const fetchVisualizationData = async (collection, useFilters = false) => {
    setIsFiltering(useFilters);
    try {
      let url = `${process.env.REACT_APP_BACKEND_URL}/api/visualize/${collection}`;
      
      if (useFilters && (selectedStates.length > 0 || selectedYears.length > 0)) {
        const params = new URLSearchParams();
        if (selectedStates.length > 0) {
          params.append('states', selectedStates.join(','));
        }
        if (selectedYears.length > 0) {
          params.append('years', selectedYears.join(','));
        }
        params.append('limit', showAllStates ? '200' : '50');
        url += `?${params.toString()}`;
      } else if (showAllStates) {
        url += '?limit=200';
      }

      const [vizResponse, insightsResponse] = await Promise.all([
        fetch(url),
        fetch(`${process.env.REACT_APP_BACKEND_URL}/api/insights/${collection}`)
      ]);

      if (vizResponse.ok) {
        const vizData = await vizResponse.json();
        setVisualizationData(vizData);
        setChartType(vizData.chart_recommendations?.recommended || 'bar');
      }

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData);
      }
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      setVisualizationData({ data: [], chart_recommendations: { recommended: 'bar' } });
      setInsights({ insights: { insight: 'Unable to load insights at this time.' } });
    } finally {
      setIsFiltering(false);
    }
  };

  const fetchFilteredData = async () => {
    if (!selectedDataset) return;
    
    setIsFiltering(true);
    try {
      const filterRequest = {
        collection: selectedDataset.collection,
        states: selectedStates.length > 0 ? selectedStates : null,
        years: selectedYears.length > 0 ? selectedYears : null,
        crime_types: selectedCrimeTypes.length > 0 ? selectedCrimeTypes : null,
        sort_by: sortBy || null,
        sort_order: sortOrder,
        limit: showAllStates ? 1000 : 100
      };

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/data/filtered`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filterRequest)
      });

      if (response.ok) {
        const data = await response.json();
        setVisualizationData({
          ...data,
          ai_insights: visualizationData?.ai_insights // Keep existing insights
        });

        // Fetch enhanced insights for filtered data with chart type context
        const enhancedFilterRequest = {
          ...filterRequest,
          chart_type: chartType // Pass selected chart type to AI
        };

        const insightsResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/insights/enhanced`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(enhancedFilterRequest)
        });

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          setInsights(insightsData);
        }
      }
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    } finally {
      setIsFiltering(false);
    }
  };

  const handleDatasetChange = (dataset) => {
    setSelectedDataset(dataset);
    fetchVisualizationData(dataset.collection);
  };

  const handleStateToggle = (state) => {
    setSelectedStates(prev => 
      prev.includes(state) 
        ? prev.filter(s => s !== state)
        : [...prev, state]
    );
  };

  const handleYearToggle = (year) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    );
  };

  const handleCrimeTypeToggle = (crimeType) => {
    setSelectedCrimeTypes(prev => 
      prev.includes(crimeType) 
        ? prev.filter(c => c !== crimeType)
        : [...prev, crimeType]
    );
  };

  const clearAllFilters = () => {
    setSelectedStates([]);
    setSelectedYears([]);
    setSelectedCrimeTypes([]);
    setSortBy('');
    setSortOrder('asc');
    if (selectedDataset) {
      fetchVisualizationData(selectedDataset.collection, false);
    }
  };

  const chartTypes = [
    { value: 'bar', label: 'Bar Chart', icon: '📊' },
    { value: 'line', label: 'Line Chart', icon: '📈' },
    { value: 'pie', label: 'Pie Chart', icon: '🥧' },
    { value: 'doughnut', label: 'Doughnut', icon: '🍩' }
  ];

  if (showLoader) {
    return <DataExplorerLoader />;
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Enhanced Data Explorer
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Advanced filtering and AI-powered insights for comprehensive data analysis across all Indian states
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Enhanced Filtering Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1 space-y-6"
          >
            {/* Dataset Selection */}
            <div className="bento-card">
              <h2 className="text-lg font-semibold mb-4">Select Dataset</h2>
              <div className="space-y-2">
                {datasets.map((dataset) => (
                  <button
                    key={dataset.collection}
                    onClick={() => handleDatasetChange(dataset)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedDataset?.collection === dataset.collection
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50'
                        : 'bg-slate-700/30 hover:bg-slate-600/30 border border-transparent'
                    }`}
                  >
                    <div className="font-medium text-sm">{dataset.name}</div>
                    <div className="text-xs text-slate-400 mt-1">
                      {dataset.record_count.toLocaleString()} records
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* States Filter */}
            {metadata && metadata.available_states.length > 0 && (
              <div className="bento-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">States</h3>
                  <span className="text-xs text-slate-400">
                    {selectedStates.length} selected
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setSelectedStates(metadata.available_states)}
                    className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-600/30"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedStates([])}
                    className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded hover:bg-red-600/30"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {metadata.available_states.map((state) => (
                    <label
                      key={state}
                      className="flex items-center p-2 hover:bg-slate-700/30 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedStates.includes(state)}
                        onChange={() => handleStateToggle(state)}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm">{state}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Years Filter */}
            {metadata && metadata.available_years.length > 0 && (
              <div className="bento-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Years</h3>
                  <span className="text-xs text-slate-400">
                    {selectedYears.length} selected
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setSelectedYears(metadata.available_years)}
                    className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-600/30"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedYears([])}
                    className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded hover:bg-red-600/30"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {metadata.available_years.map((year) => (
                    <label
                      key={year}
                      className="flex items-center p-1 hover:bg-slate-700/30 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => handleYearToggle(year)}
                        className="mr-1 rounded text-xs"
                      />
                      <span className="text-xs">{year}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Crime Types Filter (for crimes collection) */}
            {metadata && metadata.special_filters.crime_types && (
              <div className="bento-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Crime Types</h3>
                  <span className="text-xs text-slate-400">
                    {selectedCrimeTypes.length} selected
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setSelectedCrimeTypes(metadata.special_filters.crime_types)}
                    className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-600/30"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => setSelectedCrimeTypes([])}
                    className="text-xs bg-red-600/20 text-red-300 px-2 py-1 rounded hover:bg-red-600/30"
                  >
                    Clear
                  </button>
                </div>
                
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {metadata.special_filters.crime_types.map((crimeType) => (
                    <label
                      key={crimeType}
                      className="flex items-center p-2 hover:bg-slate-700/30 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCrimeTypes.includes(crimeType)}
                        onChange={() => handleCrimeTypeToggle(crimeType)}
                        className="mr-2 rounded"
                      />
                      <span className="text-sm">{crimeType}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bento-card">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showAllStates}
                      onChange={(e) => setShowAllStates(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Show All States</span>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showYearSeparately}
                      onChange={(e) => setShowYearSeparately(e.target.checked)}
                      className="mr-2 rounded"
                    />
                    <span className="text-sm">Separate by Years</span>
                  </label>
                </div>
                
                <button
                  onClick={fetchFilteredData}
                  disabled={isFiltering}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isFiltering ? (
                    <div className="flex items-center justify-center">
                      <div className="loading-dots mr-2">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      Filtering...
                    </div>
                  ) : (
                    'Apply Filters'
                  )}
                </button>
                
                <button
                  onClick={clearAllFilters}
                  className="w-full bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  Clear All Filters
                </button>
              </div>
            </div>

            {/* Chart Type Selector */}
            <div className="bento-card">
              <h3 className="text-lg font-semibold mb-4">Chart Type</h3>
              <div className="grid grid-cols-2 gap-2">
                {chartTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setChartType(type.value)}
                    className={`p-3 rounded-lg text-sm transition-all ${
                      chartType === type.value
                        ? 'bg-gradient-to-r from-blue-600/30 to-purple-600/30 border border-blue-500/50'
                        : 'bg-slate-700/30 hover:bg-slate-600/30 border border-transparent'
                    }`}
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3"
          >
            {selectedDataset && (
              <div className="space-y-6">
                {/* Dataset Info with Filtering Status */}
                <div className="bento-card">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{selectedDataset.name}</h2>
                    <div className="text-right">
                      <div className="text-sm text-slate-400">
                        {visualizationData?.total_count ? 
                          `${visualizationData.returned_count} of ${visualizationData.total_count} records` :
                          `${selectedDataset.record_count.toLocaleString()} total records`
                        }
                      </div>
                      {(selectedStates.length > 0 || selectedYears.length > 0 || selectedCrimeTypes.length > 0) && (
                        <div className="text-xs text-blue-400 mt-1">
                          🔍 Filters Applied
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-300">{selectedDataset.description}</p>
                  
                  {/* Filter Summary */}
                  {(selectedStates.length > 0 || selectedYears.length > 0 || selectedCrimeTypes.length > 0) && (
                    <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-300 mb-2">Active Filters:</h4>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {selectedStates.length > 0 && (
                          <span className="bg-green-900/30 text-green-300 px-2 py-1 rounded">
                            States: {selectedStates.length}
                          </span>
                        )}
                        {selectedYears.length > 0 && (
                          <span className="bg-purple-900/30 text-purple-300 px-2 py-1 rounded">
                            Years: {selectedYears.length}
                          </span>
                        )}
                        {selectedCrimeTypes.length > 0 && (
                          <span className="bg-red-900/30 text-red-300 px-2 py-1 rounded">
                            Crime Types: {selectedCrimeTypes.length}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Visualization */}
                <div className="bento-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Visualization</h3>
                    {(loading || isFiltering) && (
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    )}
                  </div>
                  
                  {visualizationData && visualizationData.data && visualizationData.data.length > 0 ? (
                    <div className="h-96">
                      <ChartComponent
                        data={visualizationData.data}
                        chartType={chartType}
                        height={384}
                        showYearSeparately={showYearSeparately}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 text-slate-400">
                      <div className="text-center">
                        <div className="text-4xl mb-4">📊</div>
                        <div>
                          {isFiltering ? 'Loading filtered data...' : 
                           (selectedStates.length > 0 || selectedYears.length > 0 || selectedCrimeTypes.length > 0) ?
                           'No data matches your filters' : 'No visualization data available'}
                        </div>
                        {(selectedStates.length > 0 || selectedYears.length > 0 || selectedCrimeTypes.length > 0) && (
                          <button
                            onClick={clearAllFilters}
                            className="mt-2 text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            Clear filters to see all data
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced AI Insights */}
                {insights && (
                  <div className="bento-card">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <span className="mr-2">🤖</span>
                      Enhanced AI Insights
                    </h3>
                    
                    <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                      <p className="text-slate-300">
                        {insights.insights?.insight || insights.insights}
                      </p>
                    </div>

                    {/* Enhanced Insights Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-300 mb-2">Chart Type</h4>
                        <p className="text-sm text-slate-300 capitalize">
                          {insights.insights?.chart_type || chartType} 
                          {chartType !== (insights.insights?.chart_type || 'bar') && (
                            <span className="text-xs text-blue-400 ml-2">
                              (Currently: {chartType})
                            </span>
                          )}
                        </p>
                      </div>
                      
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                        <h4 className="font-semibold text-purple-300 mb-2">Trend</h4>
                        <p className="text-sm text-slate-300 capitalize">
                          {insights.insights?.trend || 'Stable'}
                        </p>
                      </div>
                      
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <h4 className="font-semibold text-green-300 mb-2">Sample Size</h4>
                        <p className="text-sm text-slate-300">
                          {insights.sample_size || insights.analyzed_sample} records analyzed
                        </p>
                      </div>
                    </div>

                    {/* Key Findings */}
                    {insights.insights?.key_findings && insights.insights.key_findings.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">🔍 Key Findings</h4>
                        <div className="bg-slate-700/30 rounded-lg p-3">
                          <ul className="text-sm text-slate-300 space-y-1">
                            {insights.insights.key_findings.map((finding, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-cyan-400 mr-2">•</span>
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {insights.insights?.recommendations && insights.insights.recommendations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">💡 Recommendations</h4>
                        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-3">
                          <ul className="text-sm text-orange-200 space-y-1">
                            {insights.insights.recommendations.map((rec, index) => (
                              <li key={index} className="flex items-start">
                                <span className="text-orange-400 mr-2">→</span>
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* State Comparison & Temporal Analysis */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {insights.insights?.comparison_insights && (
                        <div className="bg-cyan-900/20 border border-cyan-500/30 rounded-lg p-4">
                          <h4 className="font-semibold text-cyan-300 mb-2">🗺️ State Comparison</h4>
                          <p className="text-sm text-cyan-200">
                            {insights.insights.comparison_insights}
                          </p>
                        </div>
                      )}
                      
                      {insights.insights?.temporal_analysis && (
                        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                          <h4 className="font-semibold text-indigo-300 mb-2">📈 Temporal Analysis</h4>
                          <p className="text-sm text-indigo-200">
                            {insights.insights.temporal_analysis}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Anomalies */}
                    {insights.insights?.anomalies && insights.insights.anomalies.length > 0 && (
                      <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <h4 className="font-semibold text-red-300 mb-2">⚠️ Anomalies Detected</h4>
                        <ul className="text-sm text-red-200 space-y-1">
                          {insights.insights.anomalies.map((anomaly, index) => (
                            <li key={index}>• {anomaly}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default DataExplorer;
