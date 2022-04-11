package org.wso2.carbon.apimgt.tutorial.soapservice;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.springframework.stereotype.Component;
import org.wso2.carbon.apimgt.tutorial.AlbumItem;
import org.wso2.carbon.apimgt.tutorial.MovieItem;
import org.wso2.carbon.apimgt.tutorial.SongItem;
import org.wso2.carbon.apimgt.tutorial.TvItem;

@Component
public class ItemRepository {
	private List<MovieItem> movies = new ArrayList<MovieItem>(); 
	private List<TvItem> tvSeries = new ArrayList<TvItem>(); 
	private List<AlbumItem> albums = new ArrayList<AlbumItem>(); 
	private Map<String, List<SongItem>> songs = new HashMap<String, List<SongItem>>();
	@PostConstruct
	public void initData() {
		addMovies();	
		addTvSeries();
		addAlbums();
		addSongs();
	}
	private void addSongs() {
		String key;
		SongItem item;
		
		// songs for album
		key = "Bohemian Rhapsody";
		List<SongItem> itemList = new ArrayList<SongItem>();
		item = new SongItem();
		item.setTitle("Somebody to Love");
		item.setSongId("1");
		item.setLength("4:56");
		item.setWriter("Freddie Mercury");
		itemList.add(item);
		
		item = new SongItem();
		item.setTitle("Bohemian Rhapsody");
		item.setSongId("2");
		item.setLength("5:55");
		item.setWriter("Freddie Mercury");
		itemList.add(item);
		
		item = new SongItem();
		item.setTitle("We Will Rock You");
		item.setSongId("3");
		item.setLength("2:09");
		item.setWriter("May");
		itemList.add(item);
		
		item = new SongItem();
		item.setTitle("We Are the Champions");
		item.setSongId("5");
		item.setLength("3:57");
		item.setWriter("Freddie Mercury");
		itemList.add(item);
		songs.put(key, itemList);
		
		
		// songs for album
		key = "ABBA Gold";
		itemList = new ArrayList<SongItem>();
		item = new SongItem();
		item.setTitle("Dancing Queen");
		item.setSongId("1");
		item.setLength("3:52");
		item.setWriter("	Andersson, Stig Anderson, Ulvaeus");
		itemList.add(item);

		item = new SongItem();
		item.setTitle("Mamma Mia");
		item.setSongId("2");
		item.setLength("3:33");
		item.setWriter("Andersson, Anderson, Ulvaeus");
		itemList.add(item);

		itemList.add(item);
		songs.put(key, itemList);
		
		// songs for album
		key = "25";
		itemList = new ArrayList<SongItem>();
		item = new SongItem();
		item.setTitle(	"Hello");
		item.setSongId("1");
		item.setLength("4:55");
		item.setWriter("Adele Adkins, Greg Kurstin");
		itemList.add(item);

		item = new SongItem();
		item.setTitle("I Miss You");
		item.setSongId("2");
		item.setLength("5:48");
		item.setWriter("Adele Adkins, Paul Epworth");
		itemList.add(item);

		item = new SongItem();
		item.setTitle("When We Were Young");
		item.setSongId("3");
		item.setLength("5:48");
		item.setWriter("Adele Adkins, Tobias Jesso Jr.");
		itemList.add(item);

		itemList.add(item);
		songs.put(key, itemList);
		
		
	}
	private void addAlbums() {
		AlbumItem item;
		
		item = new AlbumItem();
		item.setAlbumId("1");
		item.setAlbumName("Bohemian Rhapsody");
		item.setArtist("Freddie Mercury");
		item.setGenre("rock, pop");
		albums.add(item);
		
		item = new AlbumItem();
		item.setAlbumId("2");
		item.setAlbumName("ABBA Gold");
		item.setArtist("ABBA");
		item.setGenre("Europop");
		albums.add(item);
		
		item = new AlbumItem();
		item.setAlbumId("3");
		item.setAlbumName("25");
		item.setArtist("Adele");
		item.setGenre("Soul, pop, R&B");
		albums.add(item);
		
	}
	private void addTvSeries() {
		TvItem item;
		item = new TvItem();
		item.setCreator("James Manos Jr.");
		item.setGenres("Crime, Drama, Mystery");
		item.setName("Dexter");
		item.setRating(8.6);
		item.setSeasons("9");
		item.setStarring("Michael C. Hall, Jennifer Carpenter, David Zayas");
		item.setTvSeriesId("1");
		tvSeries.add(item);
		
		item = new TvItem();
		item.setCreator("Vince Gilligan");
		item.setGenres("Crime, Drama, Thriller");
		item.setName("Breaking Bad");
		item.setRating(9.2);
		item.setSeasons("5");
		item.setStarring("Bryan Cranston, Aaron Paul, Anna Gunn");
		item.setTvSeriesId("2");
		tvSeries.add(item);
		
	}
	private void addMovies() {
		MovieItem item = new MovieItem();
		item.setDirector("Jon Favreau");
		item.setGenre("Action, Adventure, Sci-Fi");
		item.setMovieId("1");
		item.setName("Iron Man");
		item.setRating(7.9);
		item.setReleasedOn("2 May 2008");
		item.setStarring("Robert Downey Jr., Gwyneth Paltrow, Terrence Howard");
		movies.add(item);
		
		item = new MovieItem();
		item.setDirector("Joss Whedon");
		item.setGenre("Action, Adventure, Sci-Fi");
		item.setMovieId("2");
		item.setName("Avengers Assemble");
		item.setRating(8.0);
		item.setReleasedOn("26 April 2012");
		item.setStarring("Robert Downey Jr., Chris Evans, Scarlett Johansson ");
		movies.add(item);
		
		item = new MovieItem();
		item.setDirector("Francis Ford Coppola");
		item.setGenre("Crime, Drama");
		item.setMovieId("3");
		item.setName("The Godfather");
		item.setRating(9.2);
		item.setReleasedOn("24 August 1972");
		item.setStarring("Marlon Brando, Al Pacino, James Caan");
		movies.add(item);
		
		item = new MovieItem();
		item.setDirector("Robert Zemeckis");
		item.setGenre("Drama, Romance");
		item.setMovieId("4");
		item.setName("Forrest Gump");
		item.setRating(8.8);
		item.setReleasedOn("7 October 1994");
		item.setStarring("Tom Hanks, Robin Wright, Gary Sinise");
		movies.add(item);
		
		item = new MovieItem();
		item.setDirector("Lana Wachowski, Lilly Wachowski");
		item.setGenre("Action, Sci-Fi ");
		item.setMovieId("5");
		item.setName("The Matrix");
		item.setRating(8.7);
		item.setReleasedOn("11 June 1999 ");
		item.setStarring(" Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss");
		movies.add(item);
	}
	

	List<MovieItem> getAllMovies() {
		return movies;
	}

	List<SongItem> getSongsOfAlbum(String album) {
		return songs.get(album);
	}

	List<AlbumItem> getAllAlbums() {
		return albums;
	}

	List<TvItem> getAllTVSeries() {
		return tvSeries;
	}
}
