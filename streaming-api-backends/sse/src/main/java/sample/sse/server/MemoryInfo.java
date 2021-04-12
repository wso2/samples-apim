package sample.sse.server;

public class MemoryInfo {

    private final String heap;
    private final String nonHeap;
    private final long timeStamp;

    MemoryInfo(String heap, String nonHeap) {
        this.timeStamp = System.currentTimeMillis();
        this.heap = heap;
        this.nonHeap = nonHeap;
    }

    public String getHeap() {
        return this.heap;
    }

    public String getNonHeap() {
        return this.nonHeap;
    }

    public long getTimeStamp() {
        return this.timeStamp;
    }

}
