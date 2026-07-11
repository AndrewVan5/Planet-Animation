var sun_spin = 0;

var mercury_spin = 0;
var mercury_orbit = 0;

var earth_spin = 0;
var earth_orbit = 0;

var jupiter_spin = 0;
var jupiter_orbit = 0;

var saturn_spin = 0;
var saturn_orbit = 0;

var earthmoon_spin = 0;
var earthmoon_orbit = 0;

var jupitermoon1_spin = 0;
var jupitermoon1_orbit = 0;
var jupitermoon2_spin = 0;
var jupitermoon2_orbit = 0;
var jupitermoon3_spin = 0;
var jupitermoon3_orbit = 0;

var spaceship_orbit = 0;

var camera_angle = 0;

var rocket1_angle = 0;
var rocket2_angle = 0;
var rocket3_angle = 0;




var canvas;
var gl;

var program;

var near = 1;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;

var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix, modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0;
var RY = 0;
var RZ = 0;

var MS = []; // The modeling matrix stack
var TIME = 0.0; // Realtime
var dt = 0.0
var prevTime = 0.0;
var resetTimerFlag = true;



// These are used to store the current state of objects.
// In animation it is often useful to think of an object as having some DOF
// Then the animation is simply evolving those DOF over time.
var currentRotation = [0,0,0];

var useTextures = 1;

//making a texture image procedurally
//Let's start with a 1-D array
var texSize = 8;
var imageCheckerBoardData = new Array();

// Now for each entry of the array make another array
// 2D array now!
for (var i =0; i<texSize; i++)
	imageCheckerBoardData[i] = new Array();

// Now for each entry in the 2D array make a 4 element array (RGBA! for colour)
for (var i =0; i<texSize; i++)
	for ( var j = 0; j < texSize; j++)
		imageCheckerBoardData[i][j] = new Float32Array(4);

// Now for each entry in the 2D array let's set the colour.
// We could have just as easily done this in the previous loop actually
for (var i =0; i<texSize; i++) 
	for (var j=0; j<texSize; j++) {
		var c = (i + j ) % 2;
		imageCheckerBoardData[i][j] = [c, c, c, 1];
}

//Convert the image to uint8 rather than float.
var imageCheckerboard = new Uint8Array(4*texSize*texSize);

for (var i = 0; i < texSize; i++)
	for (var j = 0; j < texSize; j++)
	   for(var k =0; k<4; k++)
			imageCheckerboard[4*texSize*i+4*j+k] = 255*imageCheckerBoardData[i][j][k];
		
// For this example we are going to store a few different textures here
var textureArray = [] ;
    
// Setting the colour which is needed during illumination of a surface
function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition2) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

// We are going to asynchronously load actual image files this will check if that call if an async call is complete
// You can use this for debugging
function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

// Helper function to load an actual file as a texture
// NOTE: The image is going to be loaded asyncronously (lazy) which could be
// after the program continues to the next functions. OUCH!
function loadFileTexture(tex, filename)
{
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
}

// Once the above image file loaded with loadFileTexture is actually loaded,
// this funcion is the onload handler and will be called.
function handleTextureLoaded(textureObj) {
	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
	
	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

// Takes an array of textures and calls render if the textures are created/loaded
// This is useful if you have a bunch of textures, to ensure that those files are
// actually loaded from disk you can wait and delay the render function call
// Notice how we call this at the end of init instead of just calling requestAnimFrame like before
function waitForTextures(texs) {
    setTimeout(
		function() {
			   var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log(texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               		console.log(wtime + " not ready yet") ;
               		waitForTextures(texs) ;
               }
               else
               {
               		console.log("ready to render") ;
					render(0);
               }
		},
	5) ;
}

// This will use an array of existing image data to load and set parameters for a texture
// We'll use this function for procedural textures, since there is no async loading to deal with
function loadImageTexture(tex, image) {
	//create and initalize a webgl texture object.
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();

	//Binds a texture to a target. Target is then used in future calls.
		//Targets:
			// TEXTURE_2D           - A two-dimensional texture.
			// TEXTURE_CUBE_MAP     - A cube-mapped texture.
			// TEXTURE_3D           - A three-dimensional texture.
			// TEXTURE_2D_ARRAY     - A two-dimensional array texture.
    gl.bindTexture(gl.TEXTURE_2D, tex.textureWebGL);

	//texImage2D(Target, internalformat, width, height, border, format, type, ImageData source)
    //Internal Format: What type of format is the data in? We are using a vec4 with format [r,g,b,a].
        //Other formats: RGB, LUMINANCE_ALPHA, LUMINANCE, ALPHA
    //Border: Width of image border. Adds padding.
    //Format: Similar to Internal format. But this responds to the texel data, or what kind of data the shader gets.
    //Type: Data type of the texel data
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0, gl.RGBA, gl.UNSIGNED_BYTE, image);
	
	//Generates a set of mipmaps for the texture object.
        /*
            Mipmaps are used to create distance with objects. 
        A higher-resolution mipmap is used for objects that are closer, 
        and a lower-resolution mipmap is used for objects that are farther away. 
        It starts with the resolution of the texture image and halves the resolution 
        until a 1x1 dimension texture image is created.
        */
    gl.generateMipmap(gl.TEXTURE_2D);
	
	//Set texture parameters.
    //texParameteri(GLenum target, GLenum pname, GLint param);
    //pname: Texture parameter to set.
        // TEXTURE_MAG_FILTER : Texture Magnification Filter. What happens when you zoom into the texture
        // TEXTURE_MIN_FILTER : Texture minification filter. What happens when you zoom out of the texture
    //param: What to set it to.
        //For the Mag Filter: gl.LINEAR (default value), gl.NEAREST
        //For the Min Filter: 
            //gl.LINEAR, gl.NEAREST, gl.NEAREST_MIPMAP_NEAREST, gl.LINEAR_MIPMAP_NEAREST, gl.NEAREST_MIPMAP_LINEAR (default value), gl.LINEAR_MIPMAP_LINEAR.
    //Full list at: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texParameter
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true;
}

// This just calls the appropriate texture loads for this example adn puts the textures in an array
function initTexturesForExample() {
    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "sun.jpg");      // index 0 (Sun)

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "mercury.jpg");  // index 1 (Mercury)

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "earth.jpg");    // index 2 (Earth)

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "jupiter.jpg");  // index 3 (Jupiter)

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "saturn.jpg");   // index 4 (Saturn)

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "moon.jpg");   // index 5 (Moon, used for all moons)
 
    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "stars.jpg");   // index 6 (Stars, used for background sphere)

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "clouds.jpg");   // index 7 

    textureArray.push({});
    loadFileTexture(textureArray[textureArray.length-1], "sun2.jpg");   // index 8 (Sun 2, pairs with sun 1 for two texture mode)

}

// Changes which texture is active in the array of texture examples (see initTexturesForExample)
function toggleTextures() {
    useTextures = (useTextures + 1) % 2
	gl.uniform1i(gl.getUniformLocation(program, "useTextures"), useTextures);
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0.5, 0.5, 1.0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    

    setColor(materialDiffuse);
	
	// Initialize some shapes, note that the curved ones are procedural which allows you to parameterize how nice they look
	// Those number will correspond to how many sides are used to "estimate" a curved surface. More = smoother
    Cube.init(program);
    Cylinder.init(20,program);
    Cone.init(20,program);
    Sphere.init(36,program);

    // Matrix uniforms
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // Lighting Uniforms
    gl.uniform4fv( gl.getUniformLocation(program, 
       "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program, 
       "specularProduct"),flatten(specularProduct) );	
    gl.uniform4fv( gl.getUniformLocation(program, 
       "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
       "shininess"),materialShininess );
    
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

	// Helper function just for this example to load the set of textures
    initTexturesForExample() ;

    waitForTextures(textureArray);
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix);
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV();   
}



// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCube() {
    setMV();
    Cube.draw();
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawSphere() {
    setMV();
    Sphere.draw();
}

// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCylinder() {
    setMV();
    Cylinder.draw();
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
// Sets the attributes and calls draw arrays
function drawCone() {
    setMV();
    Cone.draw();
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modeling matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z]));
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modeling matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z]));
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modeling matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz));
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop();
}

// pushes the current modelViewMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix);
}

// code from lab 7 as a function
function enableTexture(index) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[index].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    gl.uniform1i(gl.getUniformLocation(program, "blendTextures"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "twoTextureMode"), 0);
}

// combines two textures into one object, using texture1 and texture2 in the shader
function enableTwoTextures(index1, index2) {
    // bind first texture to unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[index1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);

    // bind second texture to unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[index2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);

    gl.uniform1i(gl.getUniformLocation(program, "blendTextures"), 1);
    gl.uniform1i(gl.getUniformLocation(program, "twoTextureMode"), 1);
}


// simply disables the texture in the shader
function disableTexture() {
    gl.uniform1i(gl.getUniformLocation(program, "blendTextures"), 0);
}


function render(timestamp) {

    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    camera_angle -= 0.1 * dt;       // camera angle changes over time
    eye = vec3(15 * Math.cos(camera_angle), 15 * Math.sin(camera_angle), 8);        // camera position in coordinates, changes over time
    up = vec3(0, 0, 1);     // up vector for the camera
    MS = []; // Initialize modeling matrix stack
	
	// initialize the modeling matrix to identity
    modelMatrix = mat4();
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at, up);
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);

    
    // set all the matrices
    setAllMatrices();
    
	// dt is the change in time or delta time from the last frame to this one
	// in animation typically we have some property or degree of freedom we want to evolve over time
	// For example imagine x is the position of a thing.
	// To get the new position of a thing we do something called integration
	// the simpelst form of this looks like:
	// x_new = x + v*dt
	// That is the new position equals the current position + the rate of of change of that position (often a velocity or speed), times the change in time
	// We can do this with angles or positions, the whole x,y,z position or just one dimension. It is up to us!
	dt = (timestamp - prevTime) / 1000.0;
	prevTime = timestamp;
    TIME += dt;
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), TIME);




    // // Star Background
    // gPush();
    //     gl.activeTexture(gl.TEXTURE0);
    //     gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    //     gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    //     gScale(30, 30, 30);
    //     drawSphere();
    // gPop();
	
	// We need to bind our textures, ensure the right one is active before we draw
	//Activate a specified "texture unit".
    //Texture units are of form gl.TEXTUREi | where i is an integer.

	
	// Now let's draw a shape animated!
	// You may be wondering where the texture coordinates are!
	// We've modified the object.js to add in support for this attribute array!

    sun_spin += 10*dt;

    mercury_spin += 100*dt;
    mercury_orbit += 20*dt

    earth_spin += 50*dt;
    earth_orbit += 25*dt;

    jupiter_spin += 30*dt;
    jupiter_orbit += 10*dt;

    saturn_orbit += 5*dt;
    saturn_spin += 30*dt;

    earthmoon_orbit += 50*dt;
    earthmoon_spin += 100*dt;

    jupitermoon1_orbit += 50*dt;
    jupitermoon1_spin += 100*dt;

    jupitermoon2_orbit += 40*dt;
    jupitermoon2_spin += 80*dt;

    jupitermoon3_orbit += 30*dt;
    jupitermoon3_spin += 60*dt;
    
    spaceship_orbit += 40*dt;

    rocket1_angle = 25 * Math.sin(TIME * 1.2);
    rocket2_angle = 30 * Math.sin(TIME * 1.6);
    rocket3_angle = 35 * Math.sin(TIME * 2.0);

    
// Star Background
gPush();
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), 0.0);     // stops stars texture from moving with time (like the sun)
    enableTexture(6);       // stars texture
    setColor(vec4(5.0, 5.0, 5.0, 1.0));     // makes stars bright so its visible
    gScale(20, 20, 20);     // makes it large so it surrounds the whole scene
    drawSphere();
gPop();




// Solar System
    gPush();
    gScale(1.15, 1.15, 1.15);       // changes scale of everything in the solar system

    // Spaceship
    gPush();

    gRotate(45, 0, 0, 1);             
    gRotate(spaceship_orbit, 1, 0, 0);      // spaceship flies around the sun   
    gTranslate(0, 0, 4.5);                
    gRotate(90, 0, 1, 0);      
    gRotate(-90, 1, 0, 0);
    gScale(0.2, 0.2, 0.2);             


    // Nose (cone)
    disableTexture();       
    gPush();
        setColor(vec4(1.0, 0.0, 0.0, 1.0));     // red nose
        gTranslate(0, 0, -1.51);
        gRotate(180, 0, 1, 0);  
        gScale(0.5, 0.5, 1.0);
        drawCone();
    gPop();

    // Body (cylinder)
    gPush();
        setColor(vec4(0.7, 0.8, 0.9, 1.0));     // silver body
        gScale(1, 1, 2.0);  
        drawCylinder();
    gPop();

    // Wing 1 (cube)
    gPush();
        setColor(vec4(0, 0, 1, 1.0));       // blue wings
        gTranslate(0, 0, 0.6);  
        gScale(1, 0.1, 0.4);   
        drawCube();
    gPop();

    // Wing 2 (cube)
    gPush();
        setColor(vec4(0, 0, 1, 1.0));
        gTranslate(0, 0, 0.6);  
        gRotate(90, 0, 0, 1);  
        gScale(1, 0.1, 0.4);   
        drawCube();
    gPop();

    // Rocket Trail 1
    gPush();
        disableTexture();
        gTranslate(0, 0, 1);
        gRotate(270, 0, 1, 0);
        gScale(2, 1.5, 1.5);             
        gRotate(rocket1_angle, 0, 1, 0);    // swings back and forwards
        setColor(vec4(1, 0.5, 0, 1.0));
        gPush();
            gTranslate(0.4, 0, 0);          // move to end
            gScale(0.4, 0.15, 0.15);        // sets dimensions for thickest trail segment  
            drawCube();
        gPop();

        // Rocket Trail 2
        gPush();
            gTranslate(0.8, 0, 0);          // move to end of upper arm
            gRotate(rocket2_angle, 0, 0, 1);        // swings back and forwards
            gPush();
                gTranslate(0.3, 0, 0);      // move to end
                gScale(0.3, 0.12, 0.12);    // second trail segment, slightly thinner
                drawCube();
            gPop();

            // Rocket Trail 3
            gPush();
                gTranslate(0.6, 0, 0);      // move to end of forearm
                gRotate(rocket3_angle, 1, 0, 0);        // swings back and forwards
                gPush();
                    gTranslate(0.3, 0, 0);      // move to end
                    gScale(0.3, 0.10, 0.10);    // third trail segment, even thinner
                    drawCube();
                gPop();
            gPop();
    gPop();
    gPop();
    gPop();
    





    // Sun
	gPush();
	{
         gl.uniform1f(gl.getUniformLocation(program, "uTime"), TIME);       // applies sun texture movement with time
        enableTwoTextures(0, 8);        // two different sun textures to create a blended effect
        setColor(vec4(1.0, 1.0, 1.0, 1.0));
		gRotate(sun_spin, 0, 0, 1);
		drawSphere();
	}
    gPop();
    gl.uniform1f(gl.getUniformLocation(program, "uTime"), 0.0);     // stops textures beyond this point from moving with time
            
            // Mercury
            gPush();
            gRotate(mercury_orbit, 0, 0, 1); 
            gTranslate(1.8, 0, 0);      // moves out to the distance it orbits from the sun   

            gPush();
            {  
            enableTexture(1);       // mercury texture
            setColor(vec4(1.0, 1.0, 1.0, 1.0));     
            gRotate(mercury_spin, 0, 0, 1);     // spins on its own axis        
            gScale(0.13, 0.13, 0.13);
            drawSphere();
            }
	        gPop();
            gPop();

            // Earth
            gPush();
            gRotate(earth_orbit, 0, 0, 1); 
            gTranslate(0, 2.5, 0);      // moves out to the distance it orbits from the sun   

            gPush();
            {       
            enableTwoTextures(2, 7);        // blended earth texture with cloud texture
            setColor(vec4(1.0, 1.0, 1.0, 1.0));    
            gRotate(earth_spin, 0, 0, 1);       // spins on its own axis        
            gScale(0.23, 0.23, 0.23);
            gRotate(23, 1, 0, 0);       // axial tilt                 
            drawSphere();
            }
            gPop();

                // EarthMoon
                gPush();
                gRotate(earthmoon_orbit, 0, 0, 1);      // moves out to the distance it orbits from the Earth 
                gTranslate(0.5, 0, 0);   

                gPush();
                {    
                enableTexture(5);       // moon texture
                setColor(vec4(1.0, 1.0, 1.0, 1.0));   
                gRotate(earthmoon_spin, 0, 0, 1);       // spins on its own axis       
                gScale(0.07, 0.07, 0.07);                
                drawSphere();
                }
                gPop();
                gPop();

	        gPop();

            // Jupiter
            gPush();
            gRotate(jupiter_orbit, 0, 0, 1);        // moves out to the distance it orbits from the sun 
            gTranslate(-3.8, 0, 0);   

            gPush();
            {       
            enableTwoTextures(3, 4);        // blended jupiter texture with saturn texture to create a more interesting surface pattern (still mostly accurate)  
            setColor(vec4(1.0, 1.0, 1.0, 1.0));
            gRotate(jupiter_spin, 0, 0, 1);     // spins on its own axis        
            gScale(0.5, 0.5, 0.5);                 
            drawSphere();
            }
            gPop();

                // JupiterMoon1
                gPush();
                gRotate(jupitermoon1_orbit, 0, 0, 1);       // moves out to the distance it orbits from Jupiter 
                gTranslate(0.8, 0, 0);   

                gPush();
                {    
                enableTexture(5);       // moon texture
                setColor(vec4(1.0, 1.0, 1.0, 1.0));   
                gRotate(jupitermoon1_spin, 0, 0, 1);        // spins on its own axis        
                gScale(0.07, 0.07, 0.07);
                gRotate(45, 1, 0, 0);                 
                drawSphere();
                }
                gPop();
                gPop();

                // JupiterMoon2
                gPush();
                gRotate(jupitermoon2_orbit, 0, 0, 1); 
                gTranslate(0, 0.95, 0);     // moves out to the distance it orbits from Jupiter 

                gPush();
                {     
                enableTexture(5);       // moon texture
                setColor(vec4(1.0, 1.0, 1.0, 1.0));  
                gRotate(jupitermoon2_spin, 0, 0, 1);       // spins on its own axis         
                gScale(0.07, 0.07, 0.07);
                gRotate(45, 1, 0, 0);                 
                drawSphere();
                }
                gPop();
                gPop();
                
                // JupiterMoon3
                gPush();
                gRotate(jupitermoon3_orbit, 0, 0, 1);       // moves out to the distance it orbits from Jupiter  
                gTranslate(1.1, 0, 0);   

                gPush();
                {     
                enableTexture(5);       // moon texture
                setColor(vec4(1.0, 1.0, 1.0, 1.0));  
                gRotate(jupitermoon3_spin, 0, 0, 1);        // spins on its own axis        
                gScale(0.07, 0.07, 0.07);
                gRotate(45, 1, 0, 0);                 
                drawSphere();
                }
                gPop();
                gPop();
	        gPop();

            // Saturn
            gPush();
            gRotate(saturn_orbit, 0, 0, 1);     // moves out to the distance it orbits from the sun
            gTranslate(0, -5.4, 0);

            gPush();
            gRotate(15, 1, 0, 0);       // axial tilt (puts rings at an angle)
            gRotate(saturn_spin, 0, 0, 1);      // spins on its own axis 
            gPush();
            enableTexture(4);       // saturn texture
            setColor(vec4(1.5, 1.5, 1.5, 1.0));
            gScale(0.4, 0.4, 0.4);
            drawSphere();
            gPop();

                // Ring
                gPush();
                disableTexture();
                gScale(1.3, 1.3, 0.15);
                drawCylinder();
                gPop(); 
    gPop();
    gPop();


            
	
    gPop();
	
    window.requestAnimFrame(render);
}
