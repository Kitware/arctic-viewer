import React        from 'react';
import DataSetView  from './DataSetView';

// Load CSS
require('./style.css');

export default React.createClass({

    displayName: 'ArcticViewer',

    propTypes: {
        basePath:   React.PropTypes.string,
        icon:       React.PropTypes.string,
        list:       React.PropTypes.array,
        title:      React.PropTypes.string,
    },

    getDefaultProps() {
        return {
            title: 'Arctic Viewer',
            icon : require('./icon.png'),
            list : [],
            basePath: '/',
        };
    },

    render() {
        const base = this.props.basePath;
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
    },
});
