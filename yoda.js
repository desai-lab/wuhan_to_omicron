var alleles = [
  'G_339_D',
  'S_371_L',
  'S_373_P',
  'S_375_F',
  'K_417_N',
  'N_440_K',
  'G_446_S',
  'S_477_N',
  'T_478_K',
  'E_484_A',
  'Q_493_R',
  'G_496_S',
  'Q_498_R',
  'N_501_Y',
  'Y_505_H'];


var N = alleles.length
var allele_divs = [];
var v;
var nb_replicates = {
  'ACE2': 3,
  'CB6': 2,
  'CoV555': 2,
  'REGN10987': 2,
  'S309': 2 
}

var layout = 'ACE2'


var nb_concs = {'Expression': null,
                'ACE2': 13,
                'CB6': 11,
                'CoV555': 10,
                'REGN10987': 10,
                'S309': 12}
var suffixes_rep = {
  'ACE2': ['_a', '_b', '_x'],
  'CB6': ['_i', '_j'],
  'CoV555': ['_e', '_v'],
  'REGN10987': ['_g', '_h'],
  'S309': ['_c', '_d']
  
}
var delta_index = null;

var clicked_variant;
var variants_in_selection;
var variant_selected_index = 0;

var alleles_fixed = [];
var alleles_colored = [];
for (let i=0; i<alleles.length; i++) {
  alleles_fixed.push('either');
}

var color_wheel = ["#0173b2","#de8f05","#029e73","#d55e00","#cc78bc","#ca9161","#ece133","#56b4e9"];

var original = "0".repeat(N)
var variant = "1".repeat(N)

var color_variants = {original: '#FF0000',
                      variant: '#0000FF'};

var annotate_variants = {original: 'Wuhan',
                         variant: 'Omicron'};

var color_wheel_rgb = [];
for (let c of color_wheel) {
  color_wheel_rgb.push(d3.color(c));
}

var main_data;
var main_svg;
var use_data;
var kd_data = {'Expression': {}, 'ACE2': {}, 'CB6': {}, 'CoV555': {}, 'REGN10987': {}, 'S309': {}};
var kd_conc_map = {
  'Expression': null,
  'ACE2': [0, -12.5, -12, -11.5, -11, -10.5, -10, -9.5,-9, -8.5, -8, -7.5, -7],
  'CB6':[0, -12.75, -12, -11.25, -10.5, -9.75, -9, -8.25, -7.5, -6.75, -6],
  'CoV555': [0, -12, -11.25, -10.5, -9.75, -9, -8.25, -7.5, -6.75, -6],
  'REGN10987':[0, -12, -11.25, -10.5, -9.75, -9, -8.25, -7.5, -6.75, -6],
  'S309': [0, -12, -11.5, -11, -10.5, -10, -9.5, -9, -8.5, -8, -7.5, -7],
}

var xs;
var ys;
// full size of the violin plot
var violin_y = d3.scaleLinear().domain([0,1]).range([50,380]);
var x_by_kd = d3.scaleLinear().domain([7,10]).range([630,790]);
var color_by_kd =   d3.scaleSequential(d3.interpolateViridis).domain([7,10]);
var color_by_delta = d3.scaleSequential(d3.interpolateRdBu).domain([-2,2]);
var color_by_freq = d3.scaleSequential(d3.interpolateRgb("white", "red")).domain([0,1]);
var kd_curve_x = d3.scaleLinear().domain([-15,-5]).range([630,790]);
var kd_curve_y = d3.scaleLinear().domain([2,5]).range([580,500]);
var scale_y_violin =  {'Expression': 0.3, 'ACE2': 0.3, 'CB6': 0.3,
                       'CoV555': 0.3, 'REGN10987': 0.3, 'S309': 0.1};

var canvasWidth = 800;
var canvasHeight = 600;
var canvas;
var ctx;
var canvasData;
var colorMap = {};
var hoverMap = [];

var click_circles = [];

var data_by_variant = {};


var kd_var = 'ACE2';
var kd_axis;

var violin_y_pos_counter = {}; //formatted like genotype: [y_baseline_position, dict from ypos to counter of pixels (for y displacement)]

var pixel_hover_range = 15 // 15 is minimum pixel for hover behavior

for (let i=0; i<canvasWidth; i++) {
  hoverMap.push([]);
  for (let j=0; j<canvasHeight; j++) {
    hoverMap[i].push({'variant': 'none', 'point_location': null, 'dist': pixel_hover_range}); 
  }
}

// DRAWING

// That's how you define the value of a pixel //
//https://stackoverflow.com/questions/7812514/drawing-a-dot-on-html5-canvas//
function drawPixel(x, y, r, g, b, a) {
  let index = (x + y * canvasWidth) * 4;

  canvasData.data[index + 0] = r;
  canvasData.data[index + 1] = g;
  canvasData.data[index + 2] = b;
  canvasData.data[index + 3] = a;
}

function clearImageData() {
  for (let i=0; i<canvasData.data.length; i++) {
    canvasData.data[i]=255;
  }
}

function draw_data() {
  clearImageData();
  for (let d of use_data) {
    let [x, y, r, g, b, a, kx, ky] = [d['x'], d['y'], d['r'], d['g'], d['b'], d['a'], d['kdx'], d['kdy']];
    drawPixel(kx, ky, r, g, b, a);
    for (let i=0; i<4; i++) {
      for (j=0; j<4; j++) {
        if (!(((i==0) || (i==3)) && ((j==0) || (j==3)))) {
          drawPixel(x-1+i, y-1+j, r, g, b, a);
        }
      }
    }
    //drawPixel(canvasData, x, y, r, g, b, 255);
    //drawPixel(canvasData, x-1, y, r, g, b, 255);
    //drawPixel(canvasData, x+1, y, r, g, b, 255);
    //drawPixel(canvasData, x, y-1, r, g, b, 255);
    //drawPixel(canvasData, x, y+1, r, g, b, 255);
  }
  ctx.putImageData(canvasData, 0, 0);
}

function draw_brush_only() {
  for (let d of use_data) {
    let [x, y, a, kx, ky] = [d['x'], d['y'], d['a'], d['kdx'], d['kdy']];
    let index = (kx + ky * canvasWidth) * 4;
    canvasData.data[index + 3] = a;
    for (let i=0; i<4; i++) {
      for (j=0; j<4; j++) {
        if (!(((i==0) || (i==3)) && ((j==0) || (j==3)))) {
          index = ((x-1+i) + (y-1+j) * canvasWidth) * 4;
          canvasData.data[index + 3] = a;
        }
      }
    }
  }
  ctx.putImageData(canvasData, 0, 0);
}

function reset_violin_y() {
  violin_y_pos_counter = {}
  for (let d of use_data) {
    d['kdy'] = get_violin_y(d['kdx'], d);
  }
}

function label_genos() {
  d3.select("#switch_holder").style('display', alleles_colored.length==0 ? 'none' : 'block');
  d3.selectAll('.geno_label').remove();
  for (let i=0; i<alleles_colored.length; i++) {
    // making the ylabels for the violin plot
    main_svg.selectAll('.NOTHING')
      .data(Object.keys(violin_y_pos_counter))
      .enter()
      .append('text')
        .attr('class', 'geno_label')
        .attr('x', 800+i*40)
        .attr('y', function(d) { return violin_y_pos_counter[d][0]+10; })
        .html(function(d) { 
          if (document.getElementById("geno_display_switch").checked) {
            return d.split(" ")[i]
          } else {
            return alleles[alleles_colored[i]].split('_')[parseInt(d.split(" ")[i])*2];
          }
        });
    //making headings for those labels (locus #s)
    main_svg.append('text')
      .attr('class', 'geno_label')
      .attr('x', 800+i*40)
      .attr('y', violin_y(0)+20)
      .html(alleles[alleles_colored[i]].split('_')[1]);
    if (i==0) {
      main_svg.append('text')
        .attr('class', 'geno_label')
        .attr('x', 750)
        .attr('y', violin_y(0)+20)
        .html('Locus:');
    }
  }
}

function color_data(first_time=false) {
  for (let d of main_data) {
    let geno_str = ''; // genotype string
    let ypos_counter = 0;
    let v = d['variant'];
    let tmp_color;
    if (alleles_colored.length==0) {
      if (delta_index === null){
        tmp_color = d['kd_color'];
      }
      else{
        tmp_color = d['delta_kd_' + delta_index]
        
      }
    }
    else {
      let color_index = 0;
      for (let i=0; i<alleles_colored.length; i++) {
        color_index += (2**i)*Number(v[alleles_colored[i]]);
        geno_str += d['variant'][alleles_colored[i]] + ' ';
        ypos_counter += (2**i)*Number(v[alleles_colored[i]]);
      }
      tmp_color = color_wheel_rgb[color_index];
    }
    colorMap[d['variant']] = tmp_color;
    d['geno_str'] = geno_str;
    d['ypos_base'] = violin_y((ypos_counter+1)/(2**alleles_colored.length+1));
    d['r'] = tmp_color['r'];
    d['g'] = tmp_color['g'];
    d['b'] = tmp_color['b'];
    if (first_time) d['a'] = 255;
  }
  reset_violin_y();
  label_genos();
  draw_data();
  
}

// INTERACTION


function flip_allele(index, allele) {
  if (alleles_fixed[index]==allele) {
    alleles_fixed[index] = 'either';
  } else {
    alleles_fixed[index] = allele;
  }
  d3.select('#new_allele_'+String(index)).classed('locked_allele', alleles_fixed[index]=="1");
  d3.select('#wt_allele_'+String(index)).classed('locked_allele', alleles_fixed[index]=="0");
  filter_data();
}


function color_allele(index) {
  if (alleles_colored.indexOf(index)>-1) {
    alleles_colored.splice(alleles_colored.indexOf(index), 1);
  } else if (alleles_colored.length==3) {
    alleles_colored.shift();
    alleles_colored.push(index);
  } else {
    alleles_colored.push(index);
  }
  for (let i=0; i<alleles.length; i++) {
    d3.select('#allele_color_button_'+String(i)).classed('colored_allele', alleles_colored.indexOf(i)>-1);
  }
  delta_index = null;
  color_data();
}

function color_delta(index) {
  alleles_colored = [];
  erase = (delta_index !== index)
  if((delta_index !== null) & (erase))
    flip_allele(delta_index, "0")

  
  delta_index = ( erase ? index : null) ;
  color_data();
  flip_allele(index, "0");
}

function change_layout(e) {
  d3.selectAll('.fdl_button').style('opacity', 1)
  if (e.target.id == 'fdl_button_Receptor') {
    layout = 'ACE2';
    e.target.style.opacity = 0.6
  }
  else if (e.target.id == 'fdl_button_Antibodies') {
    layout = 'Antibodies';
    e.target.style.opacity = 0.6
  }
  setup_center_viz();
}



function calc_percentages(variants) {
  if ([0,main_data.length].indexOf(variants.length)==-1) {
    let allele_counts = []
    for (let i=0; i<alleles.length; i++) {
      allele_counts.push(0);
    }
    for (let v of variants) {
      for (let i=0; i<alleles.length; i++) {
        if (v[i]=="1") allele_counts[i]++;
      }
    }
    for (let i=0; i<alleles.length; i++) {
      let freq = allele_counts[i]/variants.length;
      d3.select('#allele_freq_'+String(i))
        .html(String(freq).slice(0,5))
        .style('background-color', color_by_freq(freq));

    }
  } else {
    for (let i=0; i<alleles.length; i++) {
      d3.select('#allele_freq_'+String(i))
          .html('')
          .style('background-color', 'white');
    }
  }
}

// Function that is triggered when brushing is performed
function process_brush(event) {
  let extent = event.selection;
  variants_in_selection = [];
  if (extent[0][0] == extent[1][0]) { // zero area brush, undo it all
    for (let d of main_data) {
      d['a'] = 255;
      variants_in_selection.push(d['variant']);
    }
  } else {
    for (let d of main_data) {
      if ((extent[0][0] <= d['x'] && d['x'] <= extent[1][0] && extent[0][1] <= d['y'] && d['y'] <= extent[1][1]) ||
          (extent[0][0] <= d['kdx'] && d['kdx'] <= extent[1][0] && extent[0][1] <= d['kdy'] && d['kdy'] <= extent[1][1])) {
        d['a'] = 255;
        variants_in_selection.push(d['variant']);
      } else {
        d['a'] = 50;
      }
    }
  }
  this.variants_count = use_data.filter(d => d.a==255).length;
  d3.select('#total_var_count').html('# genotypes: ' + String(this.variants_count))
  if (variants_in_selection.length>0) calc_percentages(variants_in_selection);
  draw_brush_only();
}

function filter_data() {
  use_data = main_data.filter(function(d) {
    for (let i=0; i<alleles_fixed.length; i++) {
      if (alleles_fixed[i] != 'either') {
        if (d['variant'][i]!=alleles_fixed[i]) return false;
      }
    }
    return true;
  });
  this.variants_count = use_data.filter(d => d.a==255).length;
  d3.select('#total_var_count').html('# genotypes: ' + String(this.variants_count))
  reset_violin_y();
  draw_data();
  update_hover_map();
}

function highlight_variant(variant) {
  if (variant != 'none') {
    for (let i=0; i<variant.length; i++) {
      d3.select('#wt_allele_'+String(i)).classed('active_allele', variant[i]=="0");
      d3.select('#new_allele_'+String(i)).classed('active_allele', variant[i]=="1");
    }
  } else {
    if (clicked_variant) {
      for (let i=0; i<clicked_variant.length; i++) {
        d3.select('#wt_allele_'+String(i)).classed('active_allele', clicked_variant[i]=="0");
        d3.select('#new_allele_'+String(i)).classed('active_allele', clicked_variant[i]=="1");
      }
    } else {
      d3.selectAll('.allele').classed('active_allele', false);
    }
  }
}

function iterate_over_points(which_way, shift_pressed) {
  if (variants_in_selection.length>0) {
    variant_selected_index += which_way;
    if (variant_selected_index < 0) {
      variant_selected_index = variants_in_selection.length-1;
    } else if (variant_selected_index >= variants_in_selection.length) {
      variant_selected_index = 0;
    }
    click_variant(variants_in_selection[variant_selected_index]);
  }
}

function plot_kd_curve(variant) {
  if(kd_conc_map[kd_var] === null) {
    return;
  }

  let tmp_row = kd_data[kd_var].params({v_focus: variant}).filter((d,$) => d.variant == $.v_focus);
  v = tmp_row;
  let suffixes = suffixes_rep[kd_var];
  //main_svg.selectAll('.kd_curve_point').remove();
  main_svg.selectAll('.kd_curve_line').remove();
  main_svg.selectAll('.kd_label').remove();
    for (let i=0; i<nb_replicates[kd_var]; i++) {
      main_svg.append('text')
	    .attr('class', 'kd_label')
	    .attr('x', 800)
	    .attr('y', 520 + 20*i)
	    .attr('fill', color_wheel[i])
	    .html("rep. " + (i+1));

    let points = [];
    for (let j=1; j<nb_concs[kd_var]; j++) {
      /*
      main_svg.append('circle')
        .attr('class', 'kd_curve_point')
        .attr('r', 3)
        .attr('cx', kd_curve_x(j))
        .attr('cy', kd_curve_y(tmp_row['c'+String(j)+suffixes[i]]))
        .attr('fill', color_wheel[i]);
      */
      let xspot = kd_curve_x(kd_conc_map[kd_var][nb_concs[kd_var]-j]);
      let yspot_val = tmp_row.get('c'+String(j)+suffixes[i], 0);
      let yerr_zone = [yspot_val-tmp_row.get('e'+String(j)+suffixes[i], 0), yspot_val+tmp_row.get('e'+String(j)+suffixes[i], 0)];
      points.push([xspot, kd_curve_y(yspot_val)]);
      main_svg.append('path')
        .attr('class', 'kd_curve_line')
        .attr('stroke', color_wheel[i])
        .attr('stroke-width', 1)
        .attr('d', d3.line()([[xspot, kd_curve_y(yerr_zone[0])], [xspot, kd_curve_y(yerr_zone[1])]]));
    }
    main_svg.append('path')
      .attr('class', 'kd_curve_line')
      .attr('stroke', color_wheel[i])
      .attr('stroke-width', 2)
      .attr('d', d3.line()(points));
      d3.select('#kd_curve_title').html(variant + ", log₁₀(Kd) = " + tmp_row.get(kd_var + '_log10Kd', 0).toFixed(2) );
    }
}

function click_variant(variant) {
  click_circles[0]
    .attr('cx', xs(data_by_variant[variant]['fdl_' + layout + '_x']))
    .attr('cy', ys(data_by_variant[variant]['fdl_' + layout + '_y']))
    .attr('fill', colorMap[variant].formatHex())
    .attr('opacity', 1);
  click_circles[1]
    .attr('cx', data_by_variant[variant]['kdx'])
    .attr('cy', data_by_variant[variant]['kdy'])
    .attr('fill', colorMap[variant].formatHex())
    .attr('opacity', 1);
  variant_selected_index = variants_in_selection.indexOf(variant);
  clicked_variant = variant;
  highlight_variant(variant);
  console.log('clicked on', variant);
  plot_kd_curve(variant);
}

function check_for_hover_call(x, y, xe, ye, d, xo, yo) { // xo and yo are the corresponding points coordinates (from the violin plot or main plot)
  for (let i=-1*pixel_hover_range; i<pixel_hover_range+1; i++) {
    let tmp_x = x+i;
    for (let j=-1*pixel_hover_range; j<pixel_hover_range+1; j++) {
      let tmp_y = y+j;
      if ( ((tmp_x>-1) && (tmp_x<canvasWidth))  && ((tmp_y>-1) && (tmp_y<canvasHeight)) ) {
        let dist = Math.sqrt((tmp_x-xe)**2 + (tmp_y-ye)**2);
        if (dist < hoverMap[tmp_x][tmp_y]['dist']) {
          hoverMap[tmp_x][tmp_y]['dist'] = dist;
          hoverMap[tmp_x][tmp_y]['variant'] = d['variant'];
          hoverMap[tmp_x][tmp_y]['point_location'] = [x+1, y+1, xo+1, yo+1]; // TO-DO Again, this is a little hacky
        }
      }
    }
  }
}

function update_hover_map() {
  for (let i=0; i<canvasWidth; i++) {
    for (let j=0; j<canvasHeight; j++) {
      hoverMap[i][j] = {'variant': 'none', 'point_location': null, 'dist': pixel_hover_range}; 
    }
  }
  for (let d of use_data) {
    let [x, y, xe, ye, kx, ky] = [d['x'], d['y'], d['x_exact'], d['y_exact'], d['kdx'], d['kdy']];
    check_for_hover_call(x, y, xe, ye, d, kx, ky);
    //check_for_hover_call(kx, ky, kx, ky, d, x, y); // not allowing hover for violin plot points, just saying that brushing is better
  }
}

function setup_left_bar() {

  d3.selectAll('#yoda_left_bar')
    .append('div')
      .attr('id', 'total_var_count')
      .html('# genotypes: ' + String(this.variants_count));

  d3.select('#yoda_left_bar').selectAll('.allele_div')
    .data(alleles)
    .enter()
    .append('div')
      .attr('class', 'allele_div')
      .style('border-bottom', function(d, i) { return (i==alleles.length-1) ? 'none' : '1px solid black'}); //no border on last one

  /*d3.selectAll('.allele_div')
    .append('div')
      .attr('class', 'allele_content allele_number')
      .html(function(d, i) { return String(i+1); });
      */


  d3.selectAll('.fdl_button')
    .on('click', function(e, d) {change_layout(e)})

  

  d3.selectAll('.allele_div')
    .append('div')
    .attr('class', 'allele_content allele_delta_button')
    .on('click', function(e, d) { color_delta(alleles.indexOf(d)); })
    .attr('id', function(d, i) { return 'allele_delta_button_'+String(i); })
    .html('Δ');

  
  d3.selectAll('.allele_div')
    .append('div')
    .attr('class', 'allele_content allele_color_button')
    .on('click', function(e, d) { color_allele(alleles.indexOf(d)); })
    .attr('id', function(d, i) { return 'allele_color_button_'+String(i); })
    .html('C');



  d3.selectAll('.allele_div')
    .append('div')
      .attr('class', 'allele_content allele_pos')
      .html(function(d) { return d.split('_')[1]; });

  d3.selectAll('.allele_div')
    .append('div')
      .attr('class', 'allele_content allele wt_allele')
      .on('click', function(e, d) { flip_allele(alleles.indexOf(d), "0"); })
      .attr('id', function(d, i) { return 'wt_allele_'+String(i); })
      .html(function(d) { return d.split('_')[0]; });

  d3.selectAll('.allele_div')
    .append('div')
      .attr('class', 'allele_content allele new_allele')
      .on('click', function(e, d) { flip_allele(alleles.indexOf(d), "1"); })
      .attr('id', function(d, i) { return 'new_allele_'+String(i); })
      .html(function(d) { return d.split('_')[2]; });
  
  d3.selectAll('.allele_div')
    .append('div')
      .attr('class', 'allele_content allele_freq')
      .attr('id', function(d, i) { return 'allele_freq_'+String(i); })
      .html('');
}

function svg_diamond(x, y, size) {
  return String(x)+','+String(y-size)+' '+String(x-size)+','+String(y)+' '+String(x)+','+String(y+size)+' '+String(x+size)+','+String(y);
}

function draw_labels() {
  d3.selectAll(".germ_som_text").remove()
  d3.selectAll(".germ_som_line").remove()

  main_svg.append('text')
    .attr('class', 'germ_som_text')
    .attr('dominant-baseline', 'hanging')
    .attr('x', xs(data_by_variant[original]['fdl_' + layout + '_x'])-100)
    .attr('y', 60)
    .style('inline-size', '100px')
    .html('Wuhan');


  main_svg.append('line')
    .attr('class', 'germ_som_line')
    .attr('stroke', '#555555')
    .attr('stroke-width', 1)
    .attr('x1', xs(data_by_variant[original]['fdl_' + layout + '_x'])-60)
    .attr('y1', 70)
    .attr('x2', xs(data_by_variant[original]['fdl_' + layout + '_x']))
    .attr('y2', ys(data_by_variant[original]['fdl_' + layout + '_y']));

  main_svg.append('text')
    .attr('class', 'germ_som_text')
    .attr('dominant-baseline', 'hanging')
    .attr('x', xs(data_by_variant[variant]['fdl_' + layout + '_x'])+50)
    .attr('y', 600)
    .style('inline-size', '100px')
    .html('Omicron');

  main_svg.append('line')
    .attr('class', 'germ_som_line')
    .attr('stroke', '#555555')
    .attr('stroke-width', 1)
    .attr('x1', xs(data_by_variant[variant]['fdl_' + layout + '_x'])+25)
    .attr('y1', 595)
    .attr('x2', xs(data_by_variant[variant]['fdl_' + layout + '_x']))
    .attr('y2', ys(data_by_variant[variant]['fdl_' + layout + '_y']));
}


function setup_interaction() {
  update_hover_map();
  /* old coloring of germline and somatic
  for (let v of Object.keys(color_variants)) {
    main_svg
      .append('polygon')
        .attr('points', svg_diamond(xs(data_by_variant[v]['fdl_' + layout + '_x']), ys(data_by_variant[v]['fdl_' + layout + '_y']), 6))
        .attr('fill', color_variants[v])
        .attr('stroke', 'none');
  }
  */

  // setup hover circles


  
  if(!("hover_circles" in window)){
    var hover_circles = [];
    for (let i = 0; i < 2; i++) {
      hover_circles.push(main_svg.append('circle')
			 .attr('r', 5)
			 .attr('cx', 100)
			 .attr('cy', 100)
			 .attr('fill', 'none')
			 .attr('stroke', '#000000')
			 .attr('opacity', 0));
      click_circles.push(main_svg.append('circle')
			 .attr('r', 5)
			 .attr('cx', 100)
			 .attr('cy', 100)
			 .attr('fill', 'none')
			 .attr('stroke', '#FF0088')
			 .attr('stroke-width', 2)
			 .attr('opacity', 0));
    }
  }



  main_svg.on('mousemove', null) 
  main_svg.on('mousemove', function(event, d) {
    let [mx, my] = d3.pointer(event, this);
    if ((mx < canvasWidth) && (my < canvasHeight)) {
      let hover_el = hoverMap[Math.round(mx)][Math.round(my)];
      if (hover_el) {
        if (hover_el['variant'] != 'none') {
          let v = hover_el['variant'];
          highlight_variant(v);
          hover_circles[0]
            .attr('cx', hover_el['point_location'][0])
            .attr('cy', hover_el['point_location'][1])
            .attr('fill', colorMap[hover_el['variant']].formatHex())
            .attr('opacity', 1);
          hover_circles[1]
            .attr('cx', data_by_variant[v]['kdx'])
            .attr('cy', data_by_variant[v]['kdy'])
            .attr('fill', colorMap[hover_el['variant']].formatHex())
            .attr('opacity', 1);
        } else {
          highlight_variant('none');
          hover_circles[0].attr('opacity', 0);
          hover_circles[1].attr('opacity', 0);
        }
      }
    }
  });

  main_svg.on('click', null)
  main_svg.on('click', function(event, d) {
    main_svg.selectAll('.kd_curve_line').remove();
    let [mx, my] = d3.pointer(event, this);
    if ((mx < canvasWidth) && (my < canvasHeight)) {
      let hover_el = hoverMap[Math.round(mx)][Math.round(my)];
      if (hover_el) {
          if (hover_el['variant'] != 'none') {
          click_variant(hover_el['variant']);
        } else {
          highlight_variant('none');
          click_circles[0].attr('opacity', 0);
          click_circles[1].attr('opacity', 0);
        }
      } 
    }
  });
  //adding violin plot axis
  kd_axis = main_svg.append('g')
    .attr('id', 'kd_axis')
    .attr("transform", "translate(0,"+String(violin_y(1))+")").call(d3.axisBottom().scale(x_by_kd).ticks(4));
  main_svg.append('text')
    .attr('class', 'x_axis_label')
    .attr('id', 'x_axis_label_violin')
    .attr('x', x_by_kd(8.5))
    .attr('y', violin_y(1)+50)
    .html((kd_var != 'Expression' ? '-log10(Kd)': 'Expression'));
  // adding brushing https://www.d3-graph-gallery.com/graph/interactivity_brush.html
  main_svg.call( d3.brush()                 // Add the brush feature using the d3.brush function
      .extent( [ [0,0], [canvasWidth,canvasHeight] ] ) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
      .on("start brush", function(event) { process_brush(event); }) // Each time the brush selection changes, trigger the 'process_brush' function
    )


  d3.select('body').on('keydown', function(e) {
    if (['ArrowDown', 'ArrowRight'].indexOf(e.key)>-1) {
      iterate_over_points(1, e.shiftKey);
    } else if (['ArrowUp', 'ArrowLeft'].indexOf(e.key)>-1) {
      iterate_over_points(-1, e.shiftKey);
    }
  })

  d3.select("#geno_display_switch").on("change", label_genos);
}



function setup_violin(){
  // adding bottom plot for kd curves
  //adding violin plot axis
  main_svg.append('g')
    .attr('class', 'kd_curve_axis')
    .attr("transform", "translate(0,"+String(kd_curve_y(2))+")").call(d3.axisBottom().scale(kd_curve_x).ticks(4));

  main_svg.append('g')
    .attr('class', 'kd_curve_axis')
    .attr("transform", "translate("+String(kd_curve_x(-15))+", 0)").call(d3.axisLeft().scale(kd_curve_y).ticks(4));

  main_svg.append('text')
    .attr('class', 'x_axis_label')
    .attr('x', kd_curve_x(-10))
    .attr('y', kd_curve_y(2)+50)
    .html('log[concentration]');

  main_svg.append('text')
    .attr('id', 'kd_curve_title')
    .attr('class', 'x_axis_label')
    .attr('x', kd_curve_x(-10))
    .attr('y', kd_curve_y(5.6))
    .html('');

  main_svg.append('text')
    .attr('class', 'y_axis_label')
    .attr('x', kd_curve_x(-16.5))
    .attr('y', kd_curve_y(3.5))
    .html('mean');
  main_svg.append('text')
    .attr('class', 'y_axis_label')
    .attr('x', kd_curve_x(-16.5))
    .attr('y', kd_curve_y(2.5))
    .html('bin');  
}


function get_violin_y(xpos, d) {
  if (!(d['geno_str'] in violin_y_pos_counter)) {
    violin_y_pos_counter[d['geno_str']] = [d['ypos_base'], {}];
  }
  let tmp_dict = violin_y_pos_counter[d['geno_str']][1];
  if (xpos in tmp_dict) {
    if(tmp_dict[xpos] < 1000){  // if too high, cut if off so that it's not ugly (mostly apply to pin values)
      tmp_dict[xpos]++;
    }
  } else {
    tmp_dict[xpos]=0;
  }
  return Math.round(d['ypos_base'] + ((tmp_dict[xpos] % 2)-0.5)*scale_y_violin[kd_var]*tmp_dict[xpos]);
}


function kd_for(kd_var_tmp) {
  kd_var = kd_var_tmp;
  if (kd_var == 'ACE2') {
    x_by_kd = d3.scaleLinear().domain([7,10]).range([630,790]);
    color_by_kd = d3.scaleSequential(d3.interpolateViridis).domain([7,10]);
    d3.select("#x_axis_label_violin").text("-log10(Kd)");
  }
  else if (kd_var == 'Expression'){
    x_by_kd = d3.scaleLinear().domain([0.8,1.2]).range([630,790]);
    color_by_kd = d3.scaleSequential(d3.interpolateViridis).domain([1.2,0.8]);
    d3.select("#x_axis_label_violin").text("Expression");
  }
  else if (kd_var == 'S309'){
    x_by_kd = d3.scaleLinear().domain([7,11]).range([630,790]);
    color_by_kd = d3.scaleSequential(d3.interpolateViridis).domain([7.5,10]);
    d3.select("#x_axis_label_violin").text("-log10(Kd)");
  }
  else if (kd_var == 'CB6' || kd_var == 'CoV555'){
    x_by_kd = d3.scaleLinear().domain([6,12]).range([630,790]);
    color_by_kd = d3.scaleSequential(d3.interpolateViridis).domain([6,12]);
    d3.select("#x_axis_label_violin").text("-log10(Kd)");
  }
  else if (kd_var == 'REGN10987'){
    x_by_kd = d3.scaleLinear().domain([7,11]).range([630,790]);
    color_by_kd = d3.scaleSequential(d3.interpolateViridis).domain([7.5,11]);
    d3.select("#x_axis_label_violin").text("-log10(Kd)");
  }


  
  kd_axis.remove();
  kd_axis = main_svg.append('g')
    .attr('id', 'kd_axis')
    .attr("transform", "translate(0,"+String(violin_y(1))+")").call(d3.axisBottom().scale(x_by_kd).ticks(4));
  d3.selectAll('.antigen_button').classed('antigen_active', false);
  d3.select('#antigen_'+kd_var).classed('antigen_active', true);

  for (let d of main_data) {
    if (d[kd_var+'_log10Kd'] == '') { //if Kd is undefined, assume lower limit
      d['kdx'] = x_by_kd.range()[0];
    } else {
      d['kdx'] = Math.floor(x_by_kd(Number(d[kd_var+'_log10Kd'])*-1));
    }
    d['kd_color'] = d3.color(color_by_kd(Number(d[kd_var+'_log10Kd'])*(kd_var != 'Expression' ? -1 : 1)));
    for (let i=0; i<alleles.length; i++) {
      if(d[kd_var + '_' + i + '_deltaKd'] == "null"){
        d['delta_kd_' + i] = d3.color("rgba(200,200, 200, 0.1)");
      }
      else{
        d['delta_kd_' + i] = d3.color(color_by_delta(Number(d[kd_var + '_' + i + '_deltaKd'])))
      }
    }
  }
  color_data();
  draw_data();
  if (clicked_variant) plot_kd_curve(clicked_variant);
}

function setup_viz() {

  setup_center_viz();
  setup_interaction();
  setup_violin();
  setup_left_bar();
}

function setup_center_viz(){
  canvas = document.getElementById("yoda_canvas");
  main_svg = d3.select("#yoda_svg");
  ctx = canvas.getContext("2d");
  canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
  let x_domain = d3.extent(main_data.map(d=>parseFloat(d['fdl_' + layout + '_x'])));
  let y_domain = d3.extent(main_data.map(d=>parseFloat(d['fdl_' + layout + '_y'])));
  let x_d_dif = x_domain[1]-x_domain[0];
  let y_d_dif = y_domain[1]-y_domain[0];
  if (x_d_dif > y_d_dif) {
    y_domain[0] = y_domain[0] - (x_d_dif-y_d_dif)/2 - x_d_dif/20; // first part makes scales equal (square), second is a buffer
    y_domain[1] = y_domain[1] + (x_d_dif-y_d_dif)/2 + x_d_dif/20;
    x_domain[0] = x_domain[0] - x_d_dif/20;
    x_domain[1] = x_domain[1] + x_d_dif/20;
  } else {
    y_domain[0] = y_domain[0] - y_d_dif/20;
    y_domain[1] = y_domain[1] + y_d_dif/20;
    x_domain[0] = x_domain[0] - (y_d_dif-x_d_dif)/2 - x_d_dif/20;
    x_domain[1] = x_domain[1] + (y_d_dif-x_d_dif)/2 + x_d_dif/20;
  }
  xs = d3.scaleLinear().domain(x_domain).range([600, 0]);
  ys = d3.scaleLinear().domain(y_domain).range([0, 600]);
  this.variants_count = main_data.length;
  for (let d of main_data) {
    data_by_variant[d['variant']] = d;
    d['geno_str'] = ''; //empty because no alleles are colored yet
    d['x_exact'] = xs(Number(d['fdl_' + layout + '_x']));
    d['y_exact'] = ys(Number(d['fdl_' + layout + '_y']));
    d['x'] = Math.floor(d['x_exact']); // TODO: make pixel interpretation technically correct
    d['y'] = Math.floor(d['y_exact']);
    if (d[kd_var+'_log10Kd'] == '') { //if Kd is undefined, assume lower limit
      d['kdx'] = x_by_kd.range()[0];
    } else {
      d['kdx'] = Math.floor(x_by_kd(Number(d[kd_var+'_log10Kd'])*-1));
    }
    d['kd_color'] = d3.color(color_by_kd(Number(d[kd_var+'_log10Kd'])*-1));
    for (let i=0; i<alleles.length; i++) {
      if(d[kd_var + '_' + i + '_deltaKd'] == "null"){
        d['delta_kd_' + i] = d3.color("rgba(200,200, 200, 0.1)");
      }
      else{
        d['delta_kd_' + i] = d3.color(color_by_delta(Number(d[kd_var + '_' + i + '_deltaKd'])))
      }
    }
  }
  color_data(first_time=true);
  draw_data();
  draw_labels();
  update_hover_map();
}



function read_files(fpath) {
  console.log('starting yoda viz...')
  d3.csv(fpath).then(function(data) {
    main_data = data;
    variants_in_selection = main_data.map(d => d.variant);
    use_data = main_data;
    // load the data for the Kds
    aq.loadArrow('data/ACE2.arrow').then((td) => kd_data['ACE2']=td);
    aq.loadArrow('data/CB6.arrow').then((td) => kd_data['CB6']=td);
    aq.loadArrow('data/S309.arrow').then((td) => kd_data['S309']=td);
    aq.loadArrow('data/REGN10987.arrow').then((td) => kd_data['REGN10987']=td);
    aq.loadArrow('data/CoV555.arrow').then((td) => kd_data['CoV555']=td);
    
    d3.select('#loading_message').style('display', 'none');
    setup_viz();
  });
}


function toggle_about() {
  let new_style = (d3.select('#yoda_about_div').style('display')=='none') ? 'block' : 'none';
  d3.select('#yoda_about_div').style('display', new_style);
}
