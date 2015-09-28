var React = require('react'),
    DataSetView = require('./DataSetView');

// Load CSS
require('./style.css');

export default React.createClass({

    getDefaultProps() {
        return {
            title: 'rctic Viewer',
            icon : require('./icon.png'),
            list : [],
            basePath: '/'
        };
    },

    render() {
        var base = this.props.basePath;
        return (
            <div className='ArcticViewer'>
                <div className='ArcticViewer__bar'>
                    <img src={this.props.icon}/>
                    <strong>{ this.props.title }</strong>
                </div>
                <div className='ArcticViewer__content'>
                    { this.props.list.map(function(item, i) {
                        return <DataSetView base={ base } item={item} key={'dataset_'+i}/>
                    })}
                </div>
            </div>
        );
    }
});
