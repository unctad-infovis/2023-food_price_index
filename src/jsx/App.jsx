import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import '../styles/styles.less';

// https://d3js.org/
import * as d3 from 'd3';

// Load helpers.
import CSVtoJSON from './helpers/CSVtoJSON.js';
// import formatNr from './helpers/FormatNr.js';
// import roundNr from './helpers/RoundNr.js';

// const appID = '#app-root-2023-food_price_index';

function App() {
  // Data states.
  const [data, setData] = useState(false);
  const [curYear, setCurYear] = useState(1990);
  const chartRef = useRef(null);
  const svg = useRef(null);
  const x = useRef(null);
  const y = useRef(null);

  const addData = useCallback((year) => {
    // Add the line
    svg.current.selectAll('path.line').each((line, i, nodes) => {
      d3.select(nodes[i]).attr('stroke', (d) => `rgba(0, 0, 0, ${(d[0].year - 1980) / (year - 1980) - 0.3})`).attr('stroke-width', 1);
    });
    svg.current.append('path')
      .attr('class', 'line')
      .datum(data.filter(el => (el.year === year)))
      .attr('fill', 'none')
      .attr('stroke', '#009edb')
      .attr('stroke-width', 4)
      .attr('d', d3.line()
        .x((d) => x.current(d.date.toLocaleString('default', { month: 'short' }).slice(0, 3)))
        .y((d) => y.current(d.value)));
  }, [data]);

  const createChart = useCallback(() => {
    // set the dimensions and margins of the graph
    const margin = {
      bottom: 30, left: 30, right: 20, top: 20
    };
    const height = 300 - margin.top - margin.bottom;
    const width = chartRef.current.offsetWidth - margin.left - margin.right;
    // append the svg object to the body of the page
    svg.current = d3.select(chartRef.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left},${margin.top})`
      );

    // Add X axis --> it is a date format
    x.current = d3.scalePoint()
      .domain(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
      .range([0, width]);
    svg.current.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x.current));

    // Add Y axis
    y.current = d3.scaleLinear()
      .domain([0, 180])
      .range([height, 0]);
    svg.current.append('g')
      .call(d3.axisLeft(y.current));
  }, []);

  useEffect(() => {
    createChart();
  }, [createChart]);

  useEffect(() => {
    if (data) {
      addData(curYear);
    }
  }, [addData, curYear, data]);

  useEffect(() => {
    // Implementing the setInterval method
    let interval;
    if (curYear > 2022) {
      clearInterval(interval);
    } else {
      interval = setInterval(() => {
        setCurYear(curYear + 1);
      }, 150);
    }

    // Clearing the interval
    return () => clearInterval(interval);
  }, [curYear]);

  useEffect(() => {
    const data_file = (window.location.href.includes('unctad.org')) ? '/sites/default/files/data-file/2023-food_price_index.csv' : './assets/data/2023-food_price_index.csv';
    try {
      fetch(data_file)
        .then((response) => {
          if (!response.ok) {
            throw Error(response.statusText);
          }
          return response.text();
        })
        .then(body => {
          setData(CSVtoJSON(body).map(d => ({ date: d3.timeParse('%Y-%m-%d')(d.date), year: parseInt(d.date.slice(0, 4), 10), value: parseFloat(d.value) })));
        });
    } catch (error) {
      console.error(error);
    }
  }, []);

  return (
    <div className="app">
      <div className="container">
        <h3>FAO Food price Index</h3>
        <h4>1990–2023</h4>
        <div className="chart_container">
          <div className="chart" ref={chartRef} />
          <div className="year">
            <span className="label">Year:</span>
            {' '}
            <span className="value">{curYear}</span>
          </div>
        </div>
        <h5>Source: FAO</h5>
      </div>
      <noscript>Your browser does not support JavaScript!</noscript>
    </div>
  );
}

export default App;
