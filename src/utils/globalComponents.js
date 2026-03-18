// 全局组件注册 - 将uni-app组件映射到HTML元素
export function registerGlobalComponents(app) {
  // view 组件映射到 div
  app.component('view', {
    template: '<div><slot /></div>'
  })

  // text 组件映射到 span
  app.component('text', {
    template: '<span><slot /></span>'
  })

  // button 组件保持原样
  app.component('button', {
    template: '<button><slot /></button>'
  })

  // input 组件保持原样
  app.component('input', {
    template: '<input />'
  })

  // image 组件映射到 img
  app.component('image', {
    template: '<img :src="src" :alt="alt" :style="{ width, height }" />',
    props: ['src', 'alt', 'width', 'height']
  })

  // scroll-view 组件映射到 div with overflow
  app.component('scroll-view', {
    template: '<div :style="{ overflowY: scrollY ? \'auto\' : \'hidden\', overflowX: scrollX ? \'auto\' : \'hidden\' }"><slot /></div>',
    props: ['scrollY', 'scrollX']
  })
}
