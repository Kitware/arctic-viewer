var React = require('react');

export default React.createClass({

    openDataSet() {
        ArcticViewer.load('http://' + location.host + this.props.base + this.props.item.path, document.querySelector('.react-content'));
    },

    render() {
        return (
            <div className='DataSetView'>
                <div className='DataSetView__thumbnail'
                    onClick={ this.openDataSet }
                    style={{ backgroundImage: 'url(' + this.props.base + this.props.item.thumbnail + ')' }}>
                    <i className={this.props.item.thumbnail ? '' : 'fa fa-question' }></i>
                </div>
                <div className='DataSetView__titleBar'>
                    <strong>{ this.props.item.name }</strong>
                    <span className='DataSetView__size'>{ this.props.item.size }</span>
                </div>
                <div className='DataSetView__description'>
                    { this.props.item.description }
                </div>
            </div>
        );
    }
});
