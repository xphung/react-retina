var React = require('react');

var SlidesPicker = React.createClass({

  render: function() {
    let h = React.createElement
    let props = this.props
    let items = props.items

    let itemHtml = items.map(function (listItem, i) {
      return h('li',{key:i},JSON.stringify(listItem))
    })

    return h('div', {id:'picker', style: this.props.style, onChange:this.pickSlides, onDrop:this.pickSlides, onDragOver:this.hoverSlides, onDragLeave:this.hoverSlides},
      //h('span', {style:{width:'100%', height:'100%'}, dangerouslySetInnerHTML:{__html:'<input type="file" multiple directory allowdirs webkitdirectory"/>'}}), 
      h('input', {
        type:'file',
        onChange:this.pickSlides,
        multiple:'multiple',
        ref:this.handleRef //directory:'directory'
      }),
      //h('ul', {id:'picker_list'}, 'slides:',itemHtml ? itemHtml : ''),
      this.props.children
    )
  },

  handleRef: function(node) {
    node.directory = true;
    node.webkitdirectory = true;
    node.allowdirs = true;
  },

  pickSlides: function(event) {
console.log("file: event=",event)
    event.stopPropagation()
    event.preventDefault()
    let files
    if (event.type === "drop") {
      files = event.dataTransfer.files
    } else if (event.type === "change") {
      files = event.target.files
    }
    if (files) this.listSlides(files)
  },

  hoverSlides: function(event) {
    event.stopPropagation();
    event.preventDefault();
  },

  listSlides: function(files) {
    let count = 0
console.log("pick: files="+files.length)
    let buffer = []
    let parents = [""]
    for (let i = 0; i < files.length; i++) {
      let parent = parents[parents.length-1]
      let file = files.item(i)
      let type = file.type
      let name = file.name
      let path = file.webkitRelativePath || (parent + name)
//if (i < 12) console.log(i+' list file='+name+' path='+path)

      if (type == '') {
        // special code for Rapp file open to enable preservation of directory structure
        if (name.endsWith('<dir_begin>')) {
          parents.push(path.slice(0, -11)+'/')
        } else if (name.endsWith('<dir_end>')) {
          parents.pop()
        }
      } else if (type.startsWith('image')) {
        let url = window.URL.createObjectURL(file)
        slide = {title:path, src:url, type:type, lastModified:file.lastModified, size:file.size}
        buffer.push(slide)
        if (buffer.length >= 30) {
          this.props.addItem(buffer)
          buffer.length = 0
        }
      }
//console.log(i+" list: url="+url)
    }
    if (buffer.length > 0) this.props.addItem(buffer)
  }

})

module.exports = SlidesPicker;
