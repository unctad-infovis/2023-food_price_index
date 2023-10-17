import React, {
  useState, useEffect, useRef, useCallback
} from 'react';
import '../styles/styles.less';

// https://d3js.org/
import * as d3 from 'd3';

// https://vis4.net/chromajs/
import chroma from 'chroma-js';

// Load helpers.
import CSVtoJSON from './helpers/CSVtoJSON.js';
// import formatNr from './helpers/FormatNr.js';
// import roundNr from './helpers/RoundNr.js';

// const appID = '#app-root-2023-food_price_index';

function App() {
  // Data states.
  const endYear = 2023;
  const startYear = 1990;
  const chartRef = useRef(null);
  const interval = useRef(null);
  const svg = useRef(null);
  const x = useRef(null);
  const y = useRef(null);
  const [curYear, setCurYear] = useState(startYear);
  const [data, setData] = useState(false);

  const f = chroma.scale(['rgba(0, 158, 219, 0.1)', '#009edb']).domain([0.27, 1]);

  const tooltip = d3.select('.tooltip');

  const mouseover = useCallback((event, d) => {
    if (d[0].year !== curYear) {
      d3.select(event.currentTarget).attr('stroke-width', 3);
    }
    d3.select(event.currentTarget).attr('stroke', '#ab1d37');
    tooltip.style('opacity', 1);
  }, [tooltip, curYear]);

  const mousemove = useCallback((event, d) => {
    tooltip
      .html(`${d[0].year}`)
      .style('opacity', 1)
      .style('left', `${(event.x) / 2}px`)
      .style('top', `${(event.y) / 2}px `);
  }, [tooltip]);

  const mouseleave = useCallback((event, d) => {
    if (d[0].year !== curYear) {
      d3.select(event.currentTarget).attr('stroke-width', 1);
    }
    d3.selectAll('.line').attr('stroke', (line) => ((line[0].year !== curYear) ? f(1 - ((curYear - line[0].year) / 100) * 2 - 0.4) : '#009edb'));
    tooltip
      .transition()
      .duration(200)
      .style('opacity', 0);
  }, [tooltip, f, curYear]);

  const addData = useCallback((year) => {
    // Remove and add existing lines
    for (let i = startYear; i <= endYear; i++) {
      svg.current.select(`path.line_${i}`).remove();
    }
    for (let i = (year - 1); i >= startYear; i--) {
      svg.current.select('.lines').append('path')
        .attr('class', `line line_${i}`)
        .datum(data.filter(el => (el.year === i)))
        .attr('fill', 'none')
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .attr('d', d3.line()
          .x((d) => x.current(d.date.toLocaleString('default', { month: 'short' }).slice(0, 3)))
          .y((d) => y.current(d.value)));
    }
    // Edit existing lines
    svg.current.selectAll('path.line').each((line, i, nodes) => {
      // d3.select(nodes[i]).attr('stroke', (d) => `rgba(0, 0, 0, ${(1 - ((year - d[0].year) / 100) * 2) - 0.4})`).attr('stroke-width', 1);
      d3.select(nodes[i]).attr('stroke', (d) => f(1 - ((year - d[0].year) / 100) * 2 - 0.4)).attr('stroke-width', 1);
    });
    // Add the line
    svg.current.select('.lines').append('path')
      .attr('class', `line line_${year}`)
      .datum(data.filter(el => (el.year === year)))
      .attr('fill', 'none')
      .attr('stroke', '#009edb')
      .attr('stroke-width', 5)
      .attr('d', d3.line()
        .x((d) => x.current(d.date.toLocaleString('default', { month: 'short' }).slice(0, 3)))
        .y((d) => y.current(d.value)));

    svg.current.selectAll('.line')
      .on('mouseover', (event, d) => mouseover(event, d))
      .on('mousemove', (event, d) => mousemove(event, d))
      .on('mouseleave', (event, d) => mouseleave(event, d));
  }, [data, f, mouseover, mousemove, mouseleave]);

  const toggleInterval = () => {
    if (interval !== null) {
      interval.current = setInterval(() => {
        document.querySelector('.play_pause_button').innerHTML = '⏸︎';
        setCurYear(currentState => {
          const newState = currentState + 1;
          if (newState > endYear) {
            clearInterval(interval.current);
            interval.current = null;
            document.querySelector('.play_pause_button').innerHTML = '⏵︎';
            return currentState;
          }
          return newState;
        });
      }, 150);
    }
    // Clearing the interval
    return () => {
      interval.current = null;
      clearInterval(interval.current);
    };
  };

  const togglePlayPause = () => {
    if (interval.current !== null) { // Pause
      document.querySelector('.play_pause_button').innerHTML = '⏵︎';
      clearInterval(interval.current);
      interval.current = null;
    } else { // Play
      document.querySelector('.play_pause_button').innerHTML = '⏸︎';
      if (curYear === endYear) {
        setCurYear(startYear);
      }
      toggleInterval();
    }
  };

  const createChart = useCallback(() => {
    // set the dimensions and margins of the graph
    const margin = {
      bottom: 30, left: 35, right: 20, top: 20
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

    svg.current.append('g').attr('class', 'lines');

    // Add X axis
    x.current = d3.scalePoint()
      .domain(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'])
      .range([0, width]);
    svg.current.append('g')
      .attr('transform', `translate(0,${height})`)
      .attr('class', 'axis axis_x')
      .call(d3.axisBottom(x.current));

    // Add Y axis
    y.current = d3.scaleLinear()
      .domain([0, 180])
      .range([height, 0]);
    svg.current.append('g')
      .attr('class', 'axis axis_y')
      .call(d3.axisLeft(y.current));
    toggleInterval();
  }, []);

  useEffect(() => {
    createChart();
  }, [createChart]);

  useEffect(() => {
    if (data) {
      addData(curYear);
    }
  }, [addData, curYear, data]);

  const changeYear = (event) => {
    clearInterval(interval.current);
    interval.current = null;
    document.querySelector('.play_pause_button').innerHTML = '⏵︎';
    setCurYear(parseInt(event.target.value, 10));
  };

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
        <div className="title_container">
          <div className="title_logo_container">
            <img src="./assets/img/unctad_logo.png" alt="Logo" />
          </div>
          <div className="title_text_container">
            <h3>Food price Index</h3>
            <h4>The FAO Food Price Index (FFPI) is a measure of the monthly change in international prices of a basket of food commodities, 1990–2023</h4>
          </div>
        </div>
        <div className="play_controls">
          <button type="button" className="play_pause_button" aria-label="Toggle play/pause" title="Toggle play/pause" onClick={(event) => togglePlayPause(event)} />
          <input className="play_range" type="range" aria-label="Range" value={curYear} min={startYear} max={endYear} onInput={(event) => changeYear(event)} onChange={(event) => changeYear(event)} />
        </div>
        <div className="chart_container">
          <div className="tooltip" />
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
