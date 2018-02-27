import React from 'react';
import PropTypes from 'prop-types';

import DataSetView from './DataSetView';
import icon from './icon.png';

// Load CSS
import './style.css';

export default function ArcticViewer(props) {
  const base = props.basePath;
  return (
    <div className="ArcticViewer">
      <div className="ArcticViewer__bar">
        <img src={props.icon} alt="ArcticViewer" />
        <strong>{props.title}</strong>
      </div>
      <div className="ArcticViewer__content">
        {props.list.map((item, i) => (
          <DataSetView base={base} item={item} key={`dataset_${i}`} />
        ))}
      </div>
    </div>
  );
}

ArcticViewer.propTypes = {
  basePath: PropTypes.string,
  icon: PropTypes.string,
  list: PropTypes.array,
  title: PropTypes.string,
};

ArcticViewer.defaultProps = {
  title: 'Arctic Viewer',
  icon,
  list: [],
  basePath: '/',
};
