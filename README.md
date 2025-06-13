## Upd note:

Delte 'node_modules' folder and package-lock.json, then run npm install again before run project.

## Run command:

``` npm run dev ```

## Custom Backon Button of Header

For every routes:
Step 1: Add this import, and declaration 

``` import { useBack } from "../layout" ```
``` const { setCustomBack } = useBack(); ```

Step 2: Add your function handle the backon button to this template and add it to your code. 
### Example in dataset/add/page.tsx

``` 
*Your function*

useEffect(() => {
    setCustomBack(() => *Your function name*));

    return () => setCustomBack(() => {}); // reset khi rời trang
  }, [handleBack]); 
```
