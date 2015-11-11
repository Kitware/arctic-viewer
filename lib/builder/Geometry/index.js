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

        this.firstSceneLoad = true;
        this.lookupTableManager = lutMgr;
        this.geometryDataModel = geometryDataModel;
        this.pipelineModel = pipelineModel;
        this.queryDataModel = queryDataModel;
        this.layerMap = this.queryDataModel.originalData.Geometry.layer_map,
        this.fieldMap = this.queryDataModel.originalData.CompositePipeline.fields;
        this.maxSize = queryDataModel.originalData.Geometry.object_size;

        // Handle pipeline color change
        const updatePipeline = (pipelineQuery, envelope) => {
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
        };
        this.pipelineModel.onChange(updatePipeline);

        // Handle data fetching
        this.queryDataModel.onDataChange( (data, envelope) => {
            if(data.scene) {
                this.geometryDataModel.loadScene(data.scene.data);

                if(this.firstSceneLoad) {
                    this.firstSceneLoad = false;
                    updatePipeline(this.pipelineModel.getPipelineQuery());
                }
            }
        });

        // Handle LookupTable change
        this.lookupTableManager.addFields(this.queryDataModel.originalData.Geometry.ranges,
                                          this.queryDataModel.originalData.LookupTables);
        this.lookupTableManager.onChange( (data, envelope) => {
            this.updateColoring(data.change, data.lut);
        });

        // Scene management
        this.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.z = 50;

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

        this.controls = new TrackballControls(this.camera, canvas);
        this.controls.rotateSpeed = 5.0;
        this.controls.zoomSpeed = 20;
        this.controls.panSpeed = 2;
        this.controls.noZoom = false;
        this.controls.noPan = false;
        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

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
            var pSize = this.maxSize[geo.name].points,
                iSize = this.maxSize[geo.name].index,
                geom = new THREE.BufferGeometry(),
                material = new THREE.MeshPhongMaterial({
                    color: 0xdddddd,
                    specular: 0x444444,
                    shininess: 10,
                    side: THREE.DoubleSide,
                    vertexColors: THREE.VertexColors
                }),
                colorBuf = new Float32Array(pSize * 3);

            // Add object to the scene
            var sceneObject = new THREE.Mesh( geom, material );
            this.scene.add( sceneObject );

            // Register geometry
            this.meshMap[geo.name] = {
                'mesh': sceneObject,
                'material': material,
                'colorBuffer': colorBuf
            };

            // Allocate max size object
            let pArray = new Float32Array(pSize * 3);
            let iArray = new Uint32Array(iSize);

            for(let i = 0; i < pSize; i++) {
                pArray[i] = Math.random();
            }
            for(let i = 0; i < iSize; i++) {
                iArray[i] = i % pSize;
            }

            geom.addAttribute( 'position', new THREE.BufferAttribute( pArray, 3 ) );
            geom.setIndex( new THREE.BufferAttribute(  iArray, 1 ) );
            geom.addAttribute( 'color', new THREE.BufferAttribute( colorBuf, 3 ) );
            geom.computeVertexNormals();

            this.renderer.render(this.scene, this.camera);
        } else {
            var renderInfo = this.meshMap[geo.name],
                geometry = renderInfo.mesh.geometry,
                colors = renderInfo.colorBuffer;

            if (geometry.vertices && geo.points.length !== geometry.vertices.length) {
                console.log("********  We may have a problem here, new point count = " + geo.points.length + ", old point count = " + geometry.vertices.length);
                // FIXME: Allocate new color buffer here
            }

            // geometry.setIndex( new THREE.BufferAttribute( geo.index, 1 ) );
            var index = geometry.getIndex(),
                pos = geometry.getAttribute ( 'position' ),
                color = geometry.getAttribute ( 'color' );

            if(index){
                index.array = geo.index;
                index.needsUpdate = true;
            }

            if(pos){
                pos.array = geo.points;
                pos.needsUpdate = true;
            }

            // geometry.computeFaceNormals();
            geometry.computeVertexNormals();
            // geometry.normalizeNormals();


            if (geo.hasOwnProperty('field')) {
                renderInfo.colorArrayName = geo.fieldName;
                renderInfo.fieldData = geo.field;
                colors = updateFieldColorBuffer(this.lookupTableManager.getLookupTable(geo.fieldName), geo.field, colors);
            } else {
                renderInfo.colorArrayName = null;
                renderInfo.fieldData = null;
                colors = updateGreyColorBuffer(colors);
            }

            if(color) {
                color.array = colors;
                color.needsUpdate = true;
            }

            geometry.computeBoundingBox();
        }
    }

    updateObjectVisibility(name, visibility) {
        if(this.meshMap[name]){
            this.meshMap[name].mesh.visible = visibility;
        }
    }

    resetCamera() {
        // Get bounds
        var bbox = new THREE.Box3();
        for(var meshName in this.meshMap) {
            var mesh = this.meshMap[meshName].mesh;
            mesh.geometry.computeBoundingBox();
            bbox.expandByPoint(mesh.geometry.boundingBox.min).expandByPoint(mesh.geometry.boundingBox.max);
        }
        let {center, radius} = bbox.getBoundingSphere();
        this.controls.resetCamera(center, radius);
    }

    updateSize(width, height) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( width, height );

        this.controls.handleResize();
    }

}
