var THREE = require("three"),
    TrackballControls = require("./TrackballControls");

/********************************************************************
 * Convenience function to generate colors from scalar array and LUT
 *******************************************************************/
function updateFieldColorBuffer(lut, fieldData, buf) {
    //var buf = new Float32Array(fieldData.length * 3);
    for (var i = 0; i < fieldData.length; ++i) {
        var idx = i * 3,
            color = lut.getColor(fieldData[i]);
        buf[idx] = color[0];
        buf[idx + 1] = color[1];
        buf[idx + 2] = color[2];
    }
    return buf;
}

/********************************************************************
 * Convenience function to generate the correct number of empties
 *******************************************************************/
 function updateGreyColorBuffer(buf) {
    for (var i = 0; i < buf.length; ++i) {
        buf[i] = 0.5;
    }
    return buf;
 }

export default class GeometryBuilder {
    constructor(lutMgr, geometryDataModel, pipelineModel, queryDataModel) {
        this.meshMap = {};

        this.lookupTableManager = lutMgr;
        this.geometryDataModel = geometryDataModel;
        this.pipelineModel = pipelineModel;
        this.queryDataModel = queryDataModel;
        this.layerMap = this.queryDataModel.originalData.Geometry.layer_map,
        this.fieldMap = this.queryDataModel.originalData.CompositePipeline.fields;

        this.queryDataModel.onDataChange( (data, envelope) => {
            if(data.scene) {
                this.geometryDataModel.loadScene(data.scene.data);
            }
        });

        this.lookupTableManager.addFields(this.queryDataModel.originalData.Geometry.ranges, 
                                          this.queryDataModel.originalData.LookupTables);
        this.lookupTableManager.onChange( (data, envelope) => {
            this.updateColoring(data.change, data.lut);
        });

        this.pipelineModel.onChange( (pipelineQuery, envelope) => {
            var size = pipelineQuery.length;
    
            for(var i = 0; i < size; i += 2) {
                var objectName = this.layerMap[pipelineQuery[i]],
                    fieldName = this.fieldMap[pipelineQuery[i+1]];
                // if (fieldName !== '_') {
                if (fieldName) {
                    this.geometryDataModel.colorGeometryBy(objectName, fieldName);
                    this.updateObjectVisibility(objectName, true);
                } else {
                    this.updateObjectVisibility(objectName, false);
                }
            }
        
            this.queryDataModel.fetchData();
        });


        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.z = 50;

        this.controls = new TrackballControls(this.camera);
        this.controls.rotateSpeed = 5.0;
        this.controls.zoomSpeed = 20;
        this.controls.panSpeed = 2;
        this.controls.noZoom = false;
        this.controls.noPan = false;
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

        this.scene = new THREE.Scene();
        this.scene.add( this.camera );

        this.dirLight = new THREE.DirectionalLight( 0xffffff );
        this.dirLight.position.set( 200, 200, 1000 ).normalize();

        // this.dirLight2 = new THREE.DirectionalLight( 0xffffff );
        // this.dirLight2.position.set( 200, -200, 1000).normalize();

        this.camera.add( this.dirLight );
        this.camera.add( this.dirLight.target );

        // this.camera.add( this.dirLight2 );
        // this.camera.add( this.dirLight2.target );

        this.geometryBuilderSubscription = this.geometryDataModel.onGeometryReady( (data, envelope) => {
            this.updateGeometry(data);
        });
    }

    destroy() {
        // Remove listener
        if(this.geometryBuilderSubscription) {
            this.geometryBuilderSubscription.unsubscribe();
            this.geometryBuilderSubscription = null;
        }
    }

    configureRenderer(canvas) {
        this.renderer = new THREE.WebGLRenderer({ canvas });
        this.renderer.setSize( window.innerWidth, window.innerHeight );

        // Create a render() method that can be called from anywhere
        this.render = () => {
            requestAnimationFrame( this.render );
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        };

        this.queryDataModel.fetchData();
    }

    updateColoring(whatChanged, lookupTable) {
        for (var name in this.meshMap) {
            var renderInfo = this.meshMap[name];
            if (renderInfo.colorArrayName === lookupTable.name) {
                var colors = updateFieldColorBuffer(lookupTable, renderInfo.fieldData, renderInfo.colorBuffer);
                renderInfo.mesh.geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
            }
        }
    }

    updateGeometry(geo){
        if (!this.meshMap.hasOwnProperty(geo.name)) {
            // Create new Geometry
            var geom = new THREE.BufferGeometry(),
                material = new THREE.MeshPhongMaterial({ 
                    color: 0xdddddd, 
                    specular: 0x444444, 
                    shininess: 10, 
                    side: THREE.DoubleSide,
                    vertexColors: THREE.VertexColors
                }),
                colorBuf = new Float32Array(geo.points.length * 3);

            // Add object to the scene
            var sceneObject = new THREE.Mesh( geom, material );
            this.scene.add( sceneObject );

            // Register geometry
            this.meshMap[geo.name] = {
                'mesh': sceneObject,
                'material': material,
                'colorBuffer': colorBuf
            };
        }

        var renderInfo = this.meshMap[geo.name],
            geometry = renderInfo.mesh.geometry,
            colors = renderInfo.colorBuffer;

        if (geometry.vertices && geo.points.length !== geometry.vertices.length) {
            console.log("********  We may have a problem here, new point count = " + geo.points.length + ", old point count = " + geometry.vertices.length);
            // FIXME: Allocate new color buffer here
        }

        geometry.setIndex( new THREE.BufferAttribute( geo.index, 1 ) );
        geometry.addAttribute( 'position', new THREE.BufferAttribute( geo.points, 3 ) );
        geometry.computeVertexNormals();

        if (geo.hasOwnProperty('field')) {
            renderInfo.colorArrayName = geo.fieldName;
            renderInfo.fieldData = geo.field;
            colors = updateFieldColorBuffer(this.lookupTableManager.getLookupTable(geo.fieldName), geo.field, colors);
        } else {
            renderInfo.colorArrayName = null;
            renderInfo.fieldData = null;
            colors = updateGreyColorBuffer(colors);
        }

        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    }

    updateObjectVisibility(name, visibility) {
        this.meshMap[name].mesh.visible = visibility;
    }

    resetCamera() {
        this.controls.reset();
    }

    updateSize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( width, height );

        this.controls.handleResize();
    }

}