<script lang="ts">
  import { getQuikturnContext } from "../../src/lib/context.svelte.js";

  const ctx = getQuikturnContext();
</script>

<div data-testid="ctx">
  {ctx ? `${ctx.token}|${ctx.baseUrl ?? "none"}` : "null"}
</div>
