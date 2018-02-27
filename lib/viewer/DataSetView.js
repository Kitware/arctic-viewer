import React from 'react';
import PropTypes from 'prop-types';

export default class DataSetViewer extends React.Component {
  constructor(props) {
    super(props);

    this.openDataSet = this.openDataSet.bind(this);
  }

  openDataSet() {
    ArcticViewer.load(
      `http://${window.location.host}${this.props.base}${this.props.item.path}`,
      document.querySelector('.react-content')
    ); // eslint-disable-line
  }

  render() {
    return (
      <div className="DataSetView">
        <div
          className="DataSetView__thumbnail"
          onClick={this.openDataSet}
          style={{
            backgroundImage: `url(${this.props.base +
              this.props.item.thumbnail})`,
          }}
        >
          <i className={this.props.item.thumbnail ? '' : 'fa fa-question'} />
        </div>
        <div className="DataSetView__titleBar">
          <strong>{this.props.item.name}</strong>
          <span className="DataSetView__size">{this.props.item.size}</span>
        </div>
        <div className="DataSetView__description">
          {this.props.item.description}
        </div>
      </div>
    );
  }
}

DataSetViewer.propTypes = {
  base: PropTypes.string,
  item: PropTypes.object,
};

DataSetViewer.defaultProps = {
  base: '/data/',
  item: 'index.json',
};
