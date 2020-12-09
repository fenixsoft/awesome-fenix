<template>
  <Swiper>
    <Slide>
      <img src="/introduction/images/icyfenix2.jpg" />
    </Slide>
    <Slide>
      <img src="/introduction/images/icyfenix2.jpg" />
    </Slide>
  </Swiper>
</template>

<script>
  import {Swiper, Slide} from 'vue-swiper-component';

  export default {
    name: "GithubInfos",
    components: {
      Swiper,
      Slide
    }
  }
</script>
