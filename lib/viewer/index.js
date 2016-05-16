import React        from 'react';
import DataSetView  from './DataSetView';
import icon from './icon.png';

// Load CSS
import './style.css';

export default React.createClass({

  displayName: 'ArcticViewer',

  propTypes: {
    basePath: React.PropTypes.string,
    icon: React.PropTypes.string,
    list: React.PropTypes.array,
    title: React.PropTypes.string,
  },

  getDefaultProps() {
    return {
      title: 'Arctic Viewer',
      icon,
      list: [],
      basePath: '/',
    };
  },

  render() {
    const base = this.props.basePath;
    return (
      <div className="ArcticViewer">
        <div className="ArcticViewer__bar">
          <img src={this.props.icon} alt="ArcticViewer" />
          <strong>{this.props.title}</strong>
        </div>
        <div className="ArcticViewer__content">
          {this.props.list.map((item, i) =>
            <DataSetView base={base} item={item} key={`dataset_${i}`} />
          )}
        </div>
      </div>
    );
  },
});
